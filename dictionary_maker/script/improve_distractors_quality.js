const fs = require('fs');
const path = require('path');

// 语义关联词典
// key: 中文主词
// value: { jp: 日语主词, related_cn: [...], related_jp: [...] }
const semanticDict = {
    '问卷调查': {
        jp: 'アンケート',
        related_cn: ['调研', '访问', '问答', '民意测验', '市场调查', '意见征询'],
        related_jp: ['調査', 'リサーチ', 'インタビュー', '世論調査', '質問', '回答']
    },
    '生活方式': {
        jp: 'ライフスタイル',
        related_cn: ['生活习惯', '人生观', '价值观', '生活模式', '作风', '生活节奏'],
        related_jp: ['生き方', '生活様式', '暮らし向き', '暮らし方', 'スタイル', '生活習慣']
    },
    // 可以在这里不断扩充词典
};

// 从数组中随机抽取N个元素
function getRandomElements(arr, n) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

// 优化单个单词的干扰项
function improveWordDistractors(wordData) {
    const mainChinese = wordData.中文;
    let changes = { modified: false, details: [] };

    if (semanticDict[mainChinese]) {
        const entry = semanticDict[mainChinese];
        const originalChineseDistractors = JSON.stringify(wordData.中文干扰词);
        const originalJapaneseDistractors = JSON.stringify(wordData.日语干扰词);

        // 优化中文干扰项
        const newChineseDistractors = getRandomElements(entry.related_cn, 6);
        wordData.中文干扰词 = newChineseDistractors;

        // 优化日语干扰项
        const newJapaneseDistractors = getRandomElements(entry.related_jp, 6);
        wordData.日语干扰词 = newJapaneseDistractors;

        if (originalChineseDistractors !== JSON.stringify(newChineseDistractors)) {
            changes.modified = true;
            changes.details.push(`中文干扰词: ${originalChineseDistractors} -> ${JSON.stringify(newChineseDistractors)}`);
        }
        if (originalJapaneseDistractors !== JSON.stringify(newJapaneseDistractors)) {
            changes.modified = true;
            changes.details.push(`日语干扰词: ${originalJapaneseDistractors} -> ${JSON.stringify(newJapaneseDistractors)}`);
        }
    }

    return changes;
}

// 处理单个文件
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // 创建备份
        const backupPath = filePath.replace('.json', '_quality_backup.json');
        fs.writeFileSync(backupPath, content, 'utf8');

        let totalWordsModified = 0;

        data.forEach((item, index) => {
            if (item.data) {
                const result = improveWordDistractors(item.data);
                if (result.modified) {
                    totalWordsModified++;
                    console.log(`   优化单词 ${index + 1}: ${item.data.假名}(${item.data.汉字}) - ${item.data.中文}`);
                    result.details.forEach(detail => {
                        console.log(`     -> ${detail}`);
                    });
                }
            }
        });

        if (totalWordsModified > 0) {
            // 保存修改后的文件
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`\n   ✅ 文件 ${path.basename(filePath)} 修改完成，共优化了 ${totalWordsModified} 个单词。`);
            return true;
        } else {
            console.log(`\n   ✅ 文件 ${path.basename(filePath)} 无需优化。`);
            // 如果没有修改，删除备份文件
            fs.unlinkSync(backupPath);
            return false;
        }

    } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error.message);
        return false;
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('请提供要处理的文件路径。');
        console.log('用法: node improve_distractors_quality.js <file_path>');
        return;
    }

    const targetFile = args[0];
    const filePath = path.resolve(targetFile);

    console.log('🎯 智能语义干扰项优化工具 (v2.0)\n');
    console.log(`正在处理文件: ${path.basename(filePath)}`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ 文件不存在: ${filePath}`);
        return;
    }

    processFile(filePath);

    console.log('\n✨ 优化流程结束！');
}

// 运行主函数
main();