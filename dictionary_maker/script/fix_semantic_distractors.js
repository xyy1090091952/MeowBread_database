const fs = require('fs');
const path = require('path');

// 语义相关性检查 - 根据词性和语义分类来判断干扰项是否合适
const semanticCategories = {
    // 时间相关
    time: {
        japanese: ["時間", "分", "秒", "時", "日", "月", "年", "今日", "明日", "昨日", "朝", "昼", "夜", "春", "夏", "秋", "冬", "いつも", "毎日", "普段", "時々"],
        chinese: ["时间", "分钟", "秒", "小时", "天", "月", "年", "今天", "明天", "昨天", "早晨", "中午", "晚上", "春天", "夏天", "秋天", "冬天", "总是", "每天", "平时", "有时"]
    },
    
    // 形容词/状态
    adjective: {
        japanese: ["大きい", "小さい", "高い", "低い", "新しい", "古い", "美しい", "汚い", "特別", "普通", "一般", "重要", "大事", "すごい", "面白い", "つまらない", "楽しい", "悲しい"],
        chinese: ["大", "小", "高", "低", "新", "旧", "美丽", "脏", "特别", "普通", "一般", "重要", "厉害", "有趣", "无聊", "快乐", "悲伤", "独特", "奇怪"]
    },
    
    // 动作/动词
    action: {
        japanese: ["行く", "来る", "帰る", "出る", "入る", "食べる", "飲む", "見る", "聞く", "話す", "読む", "書く", "作る", "買う", "売る", "与える", "もらう", "あげる", "くれる"],
        chinese: ["去", "来", "回去", "出去", "进来", "吃", "喝", "看", "听", "说", "读", "写", "做", "买", "卖", "给", "得到", "给予", "收到"]
    },
    
    // 地点/场所
    place: {
        japanese: ["家", "学校", "会社", "病院", "駅", "空港", "公園", "図書館", "店", "レストラン", "部屋", "外", "中", "上", "下"],
        chinese: ["家", "学校", "公司", "医院", "车站", "机场", "公园", "图书馆", "商店", "餐厅", "房间", "外面", "里面", "上面", "下面"]
    },
    
    // 人物/关系
    person: {
        japanese: ["人", "友達", "家族", "先生", "学生", "先輩", "後輩", "父", "母", "兄", "姉", "弟", "妹", "子供", "大人"],
        chinese: ["人", "朋友", "家人", "老师", "学生", "前辈", "后辈", "父亲", "母亲", "哥哥", "姐姐", "弟弟", "妹妹", "孩子", "大人"]
    },
    
    // 物品/事物
    object: {
        japanese: ["本", "机", "椅子", "車", "電車", "飛行機", "食べ物", "飲み物", "服", "靴", "鞄", "時計", "携帯", "パソコン"],
        chinese: ["书", "桌子", "椅子", "车", "电车", "飞机", "食物", "饮料", "衣服", "鞋子", "包", "手表", "手机", "电脑"]
    },
    
    // 抽象概念
    abstract: {
        japanese: ["気持ち", "心", "愛", "夢", "希望", "問題", "答え", "理由", "方法", "結果", "成功", "失敗", "努力", "経験", "知識"],
        chinese: ["心情", "心", "爱", "梦想", "希望", "问题", "答案", "理由", "方法", "结果", "成功", "失败", "努力", "经验", "知识"]
    }
};

// 不相关的词汇（政治、经济等专业术语）
const irrelevantWords = {
    japanese: ["政策", "経済", "政治", "法律", "税金", "選挙", "国会", "大統領", "首相", "議員", "条約", "憲法", "法案", "予算", "株式", "投資", "銀行", "金融", "保険", "年金"],
    chinese: ["政策", "经济", "政治", "法律", "税金", "选举", "国会", "总统", "首相", "议员", "条约", "宪法", "法案", "预算", "股票", "投资", "银行", "金融", "保险", "养老金"]
};

// 检查词汇是否属于某个语义类别
function getSemanticCategory(word, language) {
    for (const [category, words] of Object.entries(semanticCategories)) {
        if (words[language] && words[language].includes(word)) {
            return category;
        }
    }
    return null;
}

// 检查词汇是否不相关
function isIrrelevantWord(word, language) {
    return irrelevantWords[language] && irrelevantWords[language].includes(word);
}

// 获取合适的替换词
function getSuitableReplacement(originalWord, wordData, language, usedWords) {
    // 首先尝试从同一语义类别中找替换词
    const category = getSemanticCategory(originalWord, language);
    
    if (category && semanticCategories[category] && semanticCategories[category][language]) {
        const categoryWords = semanticCategories[category][language];
        const availableWords = categoryWords.filter(word => 
            !usedWords.has(word) && 
            word !== originalWord &&
            word !== wordData.中文 &&
            word !== (wordData.汉字 || wordData.假名)
        );
        
        if (availableWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            return availableWords[randomIndex];
        }
    }
    
    // 如果同类别没有合适的词，从通用词库中选择
    const generalPool = language === 'japanese' ? 
        ["材料", "方法", "時間", "場所", "人", "物", "事", "話", "気持ち", "考え"] :
        ["材料", "方法", "时间", "地方", "人", "东西", "事情", "话", "心情", "想法"];
    
    const availableWords = generalPool.filter(word => 
        !usedWords.has(word) && 
        word !== originalWord &&
        word !== wordData.中文 &&
        word !== (wordData.汉字 || wordData.假名)
    );
    
    if (availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex];
    }
    
    return language === 'japanese' ? '材料' : '材料';
}

// 检查单个单词的干扰项问题
function checkWordDistractors(wordData) {
    const issues = [];
    const mainChinese = wordData.中文;
    const mainJapanese = wordData.汉字 || wordData.假名;
    
    // 检查中文干扰项
    if (wordData.中文干扰词) {
        wordData.中文干扰词.forEach((distractor, index) => {
            // 检查是否与主词相同
            if (mainChinese === distractor) {
                issues.push({
                    type: 'chinese_identical',
                    index: index,
                    distractor: distractor,
                    reason: '与主词相同'
                });
            }
            // 检查是否是不相关词汇
            else if (isIrrelevantWord(distractor, 'chinese')) {
                issues.push({
                    type: 'chinese_irrelevant',
                    index: index,
                    distractor: distractor,
                    reason: '语义不相关'
                });
            }
        });
        
        // 检查重复项
        const seen = new Set();
        wordData.中文干扰词.forEach((distractor, index) => {
            if (seen.has(distractor)) {
                issues.push({
                    type: 'chinese_duplicate',
                    index: index,
                    distractor: distractor,
                    reason: '重复干扰项'
                });
            }
            seen.add(distractor);
        });
    }
    
    // 检查日语干扰项
    if (wordData.日语干扰词) {
        wordData.日语干扰词.forEach((distractor, index) => {
            // 检查是否与主词相同
            if (mainJapanese === distractor || wordData.假名 === distractor) {
                issues.push({
                    type: 'japanese_identical',
                    index: index,
                    distractor: distractor,
                    reason: '与主词相同'
                });
            }
            // 检查是否是不相关词汇
            else if (isIrrelevantWord(distractor, 'japanese')) {
                issues.push({
                    type: 'japanese_irrelevant',
                    index: index,
                    distractor: distractor,
                    reason: '语义不相关'
                });
            }
        });
        
        // 检查重复项
        const seen = new Set();
        wordData.日语干扰词.forEach((distractor, index) => {
            if (seen.has(distractor)) {
                issues.push({
                    type: 'japanese_duplicate',
                    index: index,
                    distractor: distractor,
                    reason: '重复干扰项'
                });
            }
            seen.add(distractor);
        });
    }
    
    return issues;
}

// 修复单个单词的干扰项
function fixWordDistractors(wordData) {
    const issues = checkWordDistractors(wordData);
    let fixedCount = 0;
    
    if (issues.length === 0) {
        return { fixedCount: 0, details: [] };
    }
    
    const details = [];
    
    // 收集已使用的词汇
    const usedJapanese = new Set(wordData.日语干扰词 || []);
    const usedChinese = new Set(wordData.中文干扰词 || []);
    
    // 添加主词到已使用集合
    usedJapanese.add(wordData.汉字 || wordData.假名);
    usedChinese.add(wordData.中文);
    
    issues.forEach(issue => {
        if (issue.type.startsWith('chinese_')) {
            const oldWord = wordData.中文干扰词[issue.index];
            const replacement = getSuitableReplacement(oldWord, wordData, 'chinese', usedChinese);
            wordData.中文干扰词[issue.index] = replacement;
            usedChinese.add(replacement);
            details.push(`中文: "${oldWord}" → "${replacement}" (${issue.reason})`);
            fixedCount++;
        } else if (issue.type.startsWith('japanese_')) {
            const oldWord = wordData.日语干扰词[issue.index];
            const replacement = getSuitableReplacement(oldWord, wordData, 'japanese', usedJapanese);
            wordData.日语干扰词[issue.index] = replacement;
            usedJapanese.add(replacement);
            details.push(`日语: "${oldWord}" → "${replacement}" (${issue.reason})`);
            fixedCount++;
        }
    });
    
    return { fixedCount, details };
}

// 处理单个文件
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // 创建备份
        const backupPath = filePath.replace('.json', '_semantic_backup.json');
        fs.writeFileSync(backupPath, content, 'utf8');
        
        let totalFixed = 0;
        let wordsWithIssues = 0;
        const allDetails = [];
        
        data.forEach((item, index) => {
            if (item.data) {
                const result = fixWordDistractors(item.data);
                if (result.fixedCount > 0) {
                    wordsWithIssues++;
                    totalFixed += result.fixedCount;
                    
                    console.log(`   修复单词 ${index + 1}: ${item.data.假名}(${item.data.汉字}) - ${item.data.中文}`);
                    result.details.forEach(detail => {
                        console.log(`     ${detail}`);
                    });
                    
                    allDetails.push({
                        word: `${item.data.假名}(${item.data.汉字}) - ${item.data.中文}`,
                        fixes: result.details
                    });
                }
            }
        });
        
        // 保存修改后的文件
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        return {
            totalFixed,
            wordsWithIssues,
            modified: totalFixed > 0,
            details: allDetails
        };
        
    } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error.message);
        return { totalFixed: 0, wordsWithIssues: 0, modified: false, details: [] };
    }
}

// 处理指定目录
function processDirectory(dirName) {
    const targetDir = path.join(__dirname, `../../${dirName}`);
    
    console.log(`🔧 开始语义优化 ${dirName} 中的干扰项...\n`);
    
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ ${dirName} 目录不存在`);
        return;
    }
    
    const files = fs.readdirSync(targetDir)
        .filter(file => file.endsWith('.json') && !file.includes('backup'))
        .sort();
    
    console.log(`📁 处理 ${files.length} 个文件\n`);
    
    let totalFilesProcessed = 0;
    let totalFilesModified = 0;
    let totalProblemsFixed = 0;
    let totalWordsWithIssues = 0;
    
    files.forEach(file => {
        console.log(`正在处理文件: ${file}`);
        const filePath = path.join(targetDir, file);
        const result = processFile(filePath);
        
        totalFilesProcessed++;
        if (result.modified) {
            totalFilesModified++;
            console.log(`   ✅ 修改完成，修复了 ${result.totalFixed} 个问题`);
        } else {
            console.log(`   ✅ 没有发现问题`);
        }
        
        totalProblemsFixed += result.totalFixed;
        totalWordsWithIssues += result.wordsWithIssues;
        console.log('');
    });
    
    console.log('📊 语义优化完成:');
    console.log(`   处理文件数: ${totalFilesProcessed}`);
    console.log(`   修改文件数: ${totalFilesModified}`);
    console.log(`   修复单词数: ${totalWordsWithIssues}`);
    console.log(`   解决问题数: ${totalProblemsFixed}`);
    
    if (totalProblemsFixed > 0) {
        console.log('\n✨ 语义干扰项优化成功完成！');
    } else {
        console.log('\n✅ 所有文件的干扰项都很合适！');
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    const targetDir = args[0] || 'liangs_class';
    
    console.log('🎯 智能语义干扰项优化工具\n');
    console.log('📋 检查项目:');
    console.log('   ✓ 相同干扰项');
    console.log('   ✓ 重复干扰项');
    console.log('   ✓ 语义不相关干扰项 (如政策、经济等专业术语)');
    console.log('   ✓ 语义类别匹配优化\n');
    
    processDirectory(targetDir);
}

// 运行主函数
main();