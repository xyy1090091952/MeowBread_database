#!/usr/bin/env node
/**
 * 日语单词同步脚本
 * 将lesson.md中的单词数据同步到lesson.json
 * 每3行为一个单词：假名、汉字、中文
 */

const fs = require('fs');
const path = require('path');

class LessonSync {
    constructor() {
        this.stats = {
            updated: 0,
            added: 0,
            total: 0
        };
    }

    /**
     * 读取并解析MD文件
     * @param {string} filePath - MD文件路径
     * @returns {Array} 单词数组
     */
    parseMdFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').map(line => line.trim());
            
            // 跳过前3行标题
            const dataLines = lines.slice(3);
            const words = [];
            
            for (let i = 0; i < dataLines.length; i += 3) {
                const kana = dataLines[i] || '';
                const kanji = dataLines[i + 1] || '';
                const chinese = dataLines[i + 2] || '';
                
                // 确保至少有假名
                if (kana.trim()) {
                    words.push({
                        假名: kana.trim(),
                        汉字: kanji.trim(),
                        中文: chinese.trim()
                    });
                }
            }
            
            return words;
        } catch (error) {
            console.error(`读取MD文件失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 读取JSON文件
     * @param {string} filePath - JSON文件路径
     * @returns {Array} JSON数据数组
     */
    loadJsonFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`读取JSON文件失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 保存JSON文件
     * @param {string} filePath - JSON文件路径
     * @param {Array} data - 要保存的数据
     */
    saveJsonFile(filePath, data) {
        try {
            // 创建备份
            const backupPath = filePath.replace('.json', `_backup_${Date.now()}.json`);
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, backupPath);
                console.log(`已创建备份文件: ${backupPath}`);
            }
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`文件已保存: ${filePath}`);
        } catch (error) {
            console.error(`保存JSON文件失败: ${error.message}`);
        }
    }

    /**
     * 根据假名查找单词
     * @param {string} kana - 假名
     * @param {Array} jsonData - JSON数据
     * @returns {Object|null} 找到的单词对象
     */
    findWordByKana(kana, jsonData) {
        return jsonData.find(item => item.data && item.data.假名 === kana) || null;
    }

    /**
     * 更新单词信息
     * @param {Object} jsonWord - JSON中的单词
     * @param {Object} mdWord - MD中的单词
     * @returns {boolean} 是否有更新
     */
    updateWordInfo(jsonWord, mdWord) {
        let updated = false;
        const data = jsonWord.data;

        // 更新汉字
        const newKanji = mdWord.汉字 === mdWord.假名 ? '' : mdWord.汉字;
        if (data.汉字 !== newKanji) {
            data.汉字 = newKanji;
            updated = true;
        }

        // 更新中文
        if (data.中文 !== mdWord.中文) {
            data.中文 = mdWord.中文;
            updated = true;
        }

        return updated;
    }

    /**
     * 创建新单词对象
     * @param {Object} mdWord - MD中的单词数据
     * @returns {Object} 新的单词对象
     */
    createNewWord(mdWord) {
        return {
            data: {
                假名: mdWord.假名,
                汉字: mdWord.汉字 === mdWord.假名 ? '' : mdWord.汉字,
                中文: mdWord.中文,
                例句: "",
                词性: "",
                日语干扰词: [],
                中文干扰词: []
            }
        };
    }

    /**
     * 同步文件
     * @param {string} mdPath - MD文件路径
     * @param {string} jsonPath - JSON文件路径
     */
    syncFiles(mdPath, jsonPath) {
        console.log('开始同步文件...');
        
        const mdWords = this.parseMdFile(mdPath);
        const jsonData = this.loadJsonFile(jsonPath);

        if (mdWords.length === 0) {
            console.error('未从MD文件读取到任何单词');
            return;
        }

        console.log(`从MD文件读取到 ${mdWords.length} 个单词`);
        console.log(`从JSON文件读取到 ${jsonData.length} 个单词`);

        // 创建假名到单词的映射
        const existingWords = new Set(jsonData.map(item => item.data?.假名).filter(Boolean));

        // 处理每个MD单词
        for (const mdWord of mdWords) {
            const existing = this.findWordByKana(mdWord.假名, jsonData);

            if (existing) {
                // 更新已存在的单词
                if (this.updateWordInfo(existing, mdWord)) {
                    this.stats.updated++;
                    console.log(`更新单词: ${mdWord.假名}`);
                }
            } else {
                // 添加新单词
                const newWord = this.createNewWord(mdWord);
                jsonData.push(newWord);
                this.stats.added++;
                console.log(`新增单词: ${mdWord.假名}`);
            }
        }

        // 保存更新后的JSON文件
        this.saveJsonFile(jsonPath, jsonData);

        // 更新统计信息
        this.stats.total = jsonData.length;
    }

    /**
     * 打印同步摘要
     */
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('同步完成摘要:');
        console.log(`更新单词数: ${this.stats.updated}`);
        console.log(`新增单词数: ${this.stats.added}`);
        console.log(`总单词数: ${this.stats.total}`);
        console.log('='.repeat(50));

        if (this.stats.added > 0) {
            console.log('\n注意：新增单词需要手动补充以下字段：');
            console.log('- 例句');
            console.log('- 词性');
            console.log('- 日语干扰词');
            console.log('- 中文干扰词');
        }
    }
}

/**
 * 主函数 - 通用化支持任意lessonX.md到lessonX.json
 */
function main() {
    const args = process.argv.slice(2);
    
    let mdFile, jsonFile;
    
    if (args.length >= 2) {
        // 直接指定文件路径
        mdFile = args[0];
        jsonFile = args[1];
    } else if (args.length === 1) {
        // 指定课程编号，自动生成路径
        const lessonNum = args[0];
        const currentDir = __dirname;
        mdFile = path.join(currentDir, 'backup', 'everyones_japanese_intermediate', `lesson${lessonNum}.md`);
        jsonFile = path.join(currentDir, '..', 'everyones_japanese_intermediate', `lesson${lessonNum}.json`);
    } else {
        // 默认处理lesson1
        const currentDir = __dirname;
        mdFile = path.join(currentDir, 'lesson1.md');
        jsonFile = path.join(currentDir, '..', 'everyones_japanese_intermediate', 'lesson1.json');
    }

    // 检查文件是否存在
    if (!fs.existsSync(mdFile)) {
        console.error(`MD文件不存在: ${mdFile}`);
        process.exit(1);
    }

    if (!fs.existsSync(jsonFile)) {
        console.error(`JSON文件不存在: ${jsonFile}`);
        process.exit(1);
    }

    console.log(`正在同步: ${path.basename(mdFile)} -> ${path.basename(jsonFile)}`);
    
    // 执行同步
    const sync = new LessonSync();
    sync.syncFiles(mdFile, jsonFile);
    sync.printSummary();
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = LessonSync;