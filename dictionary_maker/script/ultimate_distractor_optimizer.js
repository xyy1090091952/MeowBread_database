const fs = require('fs');
const path = require('path');

// 加载同义词词典
const chineseThesaurus = JSON.parse(fs.readFileSync(path.join(__dirname, 'chinese_thesaurus.json'), 'utf8'));
const japaneseThesaurus = JSON.parse(fs.readFileSync(path.join(__dirname, 'japanese_thesaurus.json'), 'utf8'));

// 从数组中随机抽取N个元素
function getRandomElements(arr, n) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

// 查找主词在词典中的key
function findKeyForWord(thesaurus, word) {
    if (thesaurus[word]) {
        return word;
    }
    for (const key in thesaurus) {
        if (thesaurus[key].includes(word)) {
            return key;
        }
    }
    return null;
}

// 优化单个单词的干扰项
function optimizeWordDistractors(wordData) {
    const mainChinese = wordData.中文;
    const mainJapanese = wordData.汉字 || wordData.假名;
    let changes = { modified: false, details: [] };

    // --- 优化中文干扰项 ---
    const chineseKey = findKeyForWord(chineseThesaurus, mainChinese);
    if (chineseKey) {
        const synonyms = chineseThesaurus[chineseKey].filter(w => w !== mainChinese); // 排除主词本身
        const newDistractors = getRandomElements(synonyms, 6);
        
        if (JSON.stringify(wordData.中文干扰词) !== JSON.stringify(newDistractors) && newDistractors.length > 0) {
            const oldDistractors = JSON.stringify(wordData.中文干扰词);
            wordData.中文干扰词 = newDistractors;
            changes.modified = true;
            changes.details.push(`中文干扰词: ${oldDistractors} -> ${JSON.stringify(newDistractors)}`);
        }
    }

    // --- 优化日语干扰项 ---
    const japaneseKey = findKeyForWord(japaneseThesaurus, mainJapanese);
    if (japaneseKey) {
        const synonyms = japaneseThesaurus[japaneseKey].filter(w => w !== mainJapanese); // 排除主词本身
        const newDistractors = getRandomElements(synonyms, 6);

        if (JSON.stringify(wordData.日语干扰词) !== JSON.stringify(newDistractors) && newDistractors.length > 0) {
            const oldDistractors = JSON.stringify(wordData.日语干扰词);
            wordData.日语干扰词 = newDistractors;
            changes.modified = true;
            changes.details.push(`日语干扰词: ${oldDistractors} -> ${JSON.stringify(newDistractors)}`);
        }
    }

    return changes;
}

// 处理目录中的所有文件
function processDirectory(dirPath) {
    console.log(`\n📁 开始处理目录: ${path.basename(dirPath)}`);
    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json') && !file.includes('backup'));

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        console.log(`\n  📄 正在处理文件: ${file}`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content) {
                console.log(`     ⚠️ 文件为空，已跳过。`);
                continue;
            }
            const data = JSON.parse(content);

            // 创建备份
            const backupPath = filePath.replace('.json', '_ultimate_backup.json');
            fs.writeFileSync(backupPath, content, 'utf8');

            let totalWordsModified = 0;

            data.forEach((item, index) => {
                if (item.data) {
                    const result = optimizeWordDistractors(item.data);
                    if (result.modified) {
                        totalWordsModified++;
                        console.log(`     ✨ 优化单词 ${index + 1}: ${item.data.假名 || ''}(${item.data.汉字 || ''}) - ${item.data.中文}`);
                        result.details.forEach(detail => {
                            console.log(`       -> ${detail}`);
                        });
                    }
                }
            });

            if (totalWordsModified > 0) {
                // 保存修改后的文件
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                console.log(`\n     ✅ 文件 ${file} 修改完成，共优化了 ${totalWordsModified} 个单词。`);
            } else {
                console.log(`\n     ✅ 文件 ${file} 无需优化。`);
                // 如果没有修改，删除备份文件
                fs.unlinkSync(backupPath);
            }

        } catch (error) {
            console.error(`     ❌ 处理文件 ${file} 时出错:`, error.message);
        }
    }
}

// 主函数
function main() {
    console.log('🎯 终极干扰项优化脚本 (v3.0) 启动！\n');
    console.log('加载中文词典... ' + Object.keys(chineseThesaurus).length + ' 个词条');
    console.log('加载日文词典... ' + Object.keys(japaneseThesaurus).length + ' 个词条');

    const baseDir = path.resolve(__dirname, '../../');
    const directoriesToProcess = ['liangs_class', 'everyones_japanese', 'everyones_japanese_intermediate', 'liangs_intermediate', 'duolingguo'];

    for (const dir of directoriesToProcess) {
        const dirPath = path.join(baseDir, dir);
        if (fs.existsSync(dirPath)) {
            processDirectory(dirPath);
        } else {
            console.log(`\n⚠️ 目录不存在，已跳过: ${dir}`);
        }
    }

    console.log('\n\n🎉🎉🎉 所有目录处理完毕！终极优化成功！ 🎉🎉🎉');
}

// 运行主函数
main();