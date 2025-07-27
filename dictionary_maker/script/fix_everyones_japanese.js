const fs = require('fs');
const path = require('path');

// 定义问题检测规则
const problemRules = {
    // 检测中文干扰项是否与本体意思相同
    checkChineseIdentical: (mainWord, distractor) => {
        // 完全相同
        if (mainWord === distractor) return true;
        
        // 常见的相同意思词汇对
        const synonymPairs = [
            ['做', '做'], ['寻找', '寻找'], ['舒服', '舒服'], ['不舒服', '不舒服'],
            ['运动会', '运动会'], ['体育节', '体育祭'], ['文化节', '文化祭'],
            ['赶上', '赶上'], ['晚了', '晚了'], ['联系', '联系']
        ];
        
        return synonymPairs.some(pair => 
            (pair[0] === mainWord && pair[1] === distractor) ||
            (pair[1] === mainWord && pair[0] === distractor)
        );
    },
    
    // 检测日语干扰项是否与本体意思相同
    checkJapaneseIdentical: (mainWord, distractor) => {
        // 完全相同
        if (mainWord === distractor) return true;
        
        // 常见的相同意思词汇对
        const synonymPairs = [
            ['やります', 'します'], // 意思几乎相同
            ['探します', '捜します'], // 意思相同
            ['見ます', '診ます'], // 不同意思但容易混淆
            ['運動会', '体育祭'], // 意思相同
        ];
        
        return synonymPairs.some(pair => 
            (pair[0] === mainWord && pair[1] === distractor) ||
            (pair[1] === mainWord && pair[0] === distractor)
        );
    }
};

// 替换建议
const replacementSuggestions = {
    chinese: {
        '做': '材料', '寻找': '技能', '舒服': '装备', '不舒服': '工具',
        '运动会': '建筑', '体育节': '食物', '文化节': '衣服', 
        '赶上': '交通', '晚了': '天气', '联系': '时间'
    },
    japanese: {
        'します': '材料', '捜します': '技能', '診ます': '装備',
        '体育祭': '建物', '文化祭': '食べ物'
    }
};

// 中文和日文替换词池
const replacementPools = {
    chinese: [
        '材料', '技能', '装备', '工具', '方法', '系统', '设备', '机器',
        '建筑', '食物', '衣服', '交通', '天气', '时间', '地点', '颜色',
        '数字', '动物', '植物', '音乐', '运动', '游戏', '电影', '书籍',
        '学校', '家庭', '朋友', '工作', '休息', '购物', '旅游', '节日'
    ],
    japanese: [
        '材料', '技能', '装備', '道具', '方法', 'システム', '設備', '機械',
        '建物', '食べ物', '服', '交通', '天気', '時間', '場所', '色',
        '数字', '動物', '植物', '音楽', 'スポーツ', 'ゲーム', '映画', '本',
        '学校', '家族', '友達', '仕事', '休み', '買い物', '旅行', '祭り'
    ]
};

// 检查单个单词的干扰项
function checkWordDistractors(wordData) {
    const issues = [];
    const mainChinese = wordData.中文;
    const mainJapanese = wordData.汉字 || wordData.假名;
    
    // 检查中文干扰项
    if (wordData.中文干扰词) {
        wordData.中文干扰词.forEach((distractor, index) => {
            if (problemRules.checkChineseIdentical(mainChinese, distractor)) {
                issues.push({
                    type: 'chinese_identical',
                    index: index,
                    distractor: distractor,
                    suggestion: replacementSuggestions.chinese[distractor] || 
                               replacementPools.chinese[Math.floor(Math.random() * replacementPools.chinese.length)]
                });
            }
        });
        
        // 检查重复项
        const duplicates = wordData.中文干扰词.filter((item, index) => 
            wordData.中文干扰词.indexOf(item) !== index
        );
        duplicates.forEach(duplicate => {
            const duplicateIndex = wordData.中文干扰词.lastIndexOf(duplicate);
            issues.push({
                type: 'chinese_duplicate',
                index: duplicateIndex,
                distractor: duplicate,
                suggestion: replacementPools.chinese[Math.floor(Math.random() * replacementPools.chinese.length)]
            });
        });
    }
    
    // 检查日语干扰项
    if (wordData.日语干扰词) {
        wordData.日语干扰词.forEach((distractor, index) => {
            if (problemRules.checkJapaneseIdentical(mainJapanese, distractor)) {
                issues.push({
                    type: 'japanese_identical',
                    index: index,
                    distractor: distractor,
                    suggestion: replacementSuggestions.japanese[distractor] || 
                               replacementPools.japanese[Math.floor(Math.random() * replacementPools.japanese.length)]
                });
            }
        });
        
        // 检查重复项
        const duplicates = wordData.日语干扰词.filter((item, index) => 
            wordData.日语干扰词.indexOf(item) !== index
        );
        duplicates.forEach(duplicate => {
            const duplicateIndex = wordData.日语干扰词.lastIndexOf(duplicate);
            issues.push({
                type: 'japanese_duplicate',
                index: duplicateIndex,
                distractor: duplicate,
                suggestion: replacementPools.japanese[Math.floor(Math.random() * replacementPools.japanese.length)]
            });
        });
    }
    
    return issues;
}

// 修复单个单词的干扰项
function fixWordDistractors(wordData, issues) {
    let fixed = false;
    
    issues.forEach(issue => {
        if (issue.type === 'chinese_identical' || issue.type === 'chinese_duplicate') {
            if (wordData.中文干扰词 && wordData.中文干扰词[issue.index]) {
                // 确保新的替换词不与现有的重复
                let newDistractor = issue.suggestion;
                while (wordData.中文干扰词.includes(newDistractor) || newDistractor === wordData.中文) {
                    newDistractor = replacementPools.chinese[Math.floor(Math.random() * replacementPools.chinese.length)];
                }
                wordData.中文干扰词[issue.index] = newDistractor;
                fixed = true;
            }
        } else if (issue.type === 'japanese_identical' || issue.type === 'japanese_duplicate') {
            if (wordData.日语干扰词 && wordData.日语干扰词[issue.index]) {
                // 确保新的替换词不与现有的重复
                let newDistractor = issue.suggestion;
                const mainJapanese = wordData.汉字 || wordData.假名;
                while (wordData.日语干扰词.includes(newDistractor) || newDistractor === mainJapanese) {
                    newDistractor = replacementPools.japanese[Math.floor(Math.random() * replacementPools.japanese.length)];
                }
                wordData.日语干扰词[issue.index] = newDistractor;
                fixed = true;
            }
        }
    });
    
    return fixed;
}

// 处理单个文件
function processFile(filePath) {
    console.log(`正在处理文件: ${path.basename(filePath)}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        let totalIssues = 0;
        let fixedWords = 0;
        
        // 创建备份
        const backupPath = filePath.replace('.json', '_backup.json');
        fs.writeFileSync(backupPath, content);
        
        data.forEach((item, wordIndex) => {
            if (item.data) {
                const issues = checkWordDistractors(item.data);
                if (issues.length > 0) {
                    console.log(`   单词 ${wordIndex + 1}: ${item.data.假名}(${item.data.汉字}) - ${item.data.中文} - 发现 ${issues.length} 个问题`);
                    issues.forEach(issue => {
                        console.log(`     ${issue.type}: ${issue.distractor} -> ${issue.suggestion}`);
                    });
                    
                    const wasFixed = fixWordDistractors(item.data, issues);
                    if (wasFixed) {
                        fixedWords++;
                    }
                    totalIssues += issues.length;
                }
            }
        });
        
        // 保存修改后的文件
        if (totalIssues > 0) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`   ✅ 修复了 ${fixedWords} 个单词的 ${totalIssues} 个问题`);
        } else {
            // 如果没有问题，删除备份文件
            fs.unlinkSync(backupPath);
            console.log(`   ✅ 没有发现问题`);
        }
        
        return { totalIssues, fixedWords };
        
    } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error.message);
        return { totalIssues: 0, fixedWords: 0 };
    }
}

// 主函数
function main() {
    const everyonesJapaneseDir = path.join(__dirname, '../../everyones_japanese');
    
    console.log('🔍 开始检查和修复 everyones_japanese 中的干扰项问题...\n');
    
    if (!fs.existsSync(everyonesJapaneseDir)) {
        console.error('❌ everyones_japanese 目录不存在');
        return;
    }
    
    const files = fs.readdirSync(everyonesJapaneseDir)
        .filter(file => file.endsWith('.json') && !file.includes('backup'))
        .sort();
    
    console.log(`📁 找到 ${files.length} 个文件需要处理\n`);
    
    let totalIssuesCount = 0;
    let totalFixedWords = 0;
    let modifiedFiles = 0;
    
    files.forEach(file => {
        const filePath = path.join(everyonesJapaneseDir, file);
        const result = processFile(filePath);
        
        if (result.totalIssues > 0) {
            modifiedFiles++;
        }
        
        totalIssuesCount += result.totalIssues;
        totalFixedWords += result.fixedWords;
    });
    
    console.log('\n📊 处理完成:');
    console.log(`   检查文件数: ${files.length}`);
    console.log(`   修改文件数: ${modifiedFiles}`);
    console.log(`   修复单词数: ${totalFixedWords}`);
    console.log(`   总问题数: ${totalIssuesCount}`);
    
    if (totalIssuesCount > 0) {
        console.log('\n✅ 所有问题已修复！');
    } else {
        console.log('\n✅ 没有发现需要修复的问题！');
    }
}

// 运行主函数
main();