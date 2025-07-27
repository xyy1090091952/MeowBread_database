const fs = require('fs');
const path = require('path');

// 检查单个单词的干扰项问题
function checkWordDistractors(wordData) {
    const issues = [];
    const mainChinese = wordData.中文;
    const mainJapanese = wordData.汉字 || wordData.假名;
    
    // 检查中文干扰项
    if (wordData.中文干扰词) {
        wordData.中文干扰词.forEach((distractor, index) => {
            // 检查是否与主词相同
            if (mainChinese.includes(distractor) || distractor.includes(mainChinese.split('、')[0])) {
                issues.push({
                    type: 'chinese_identical',
                    index: index,
                    distractor: distractor,
                    main: mainChinese
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
                    distractor: distractor
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
                    main: mainJapanese
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
                    distractor: distractor
                });
            }
            seen.add(distractor);
        });
    }
    
    return issues;
}

// 替换词库
const replacementPools = {
    japanese: [
        // 动词
        "食べます", "飲みます", "見ます", "聞きます", "読みます", "書きます", "話します", "歩きます",
        "走ります", "泳ぎます", "寝ます", "起きます", "座ります", "立ちます", "来ます", "行きます",
        "帰ります", "出ます", "入ります", "開けます", "閉めます", "作ります", "買います", "売ります",
        "借ります", "貸します", "習います", "教えます", "覚えます", "忘れます", "思います", "考えます",
        
        // 名词
        "本", "机", "椅子", "窓", "扉", "部屋", "家", "学校", "会社", "病院", "駅", "空港",
        "公園", "図書館", "銀行", "郵便局", "店", "レストラン", "喫茶店", "映画館", "美術館",
        "動物", "犬", "猫", "鳥", "魚", "花", "木", "山", "川", "海", "空", "雲", "雨", "雪",
        "春", "夏", "秋", "冬", "朝", "昼", "夜", "今日", "明日", "昨日", "時間", "分", "秒",
        
        // 形容词
        "大きい", "小さい", "高い", "低い", "長い", "短い", "広い", "狭い", "新しい", "古い",
        "美しい", "汚い", "暖かい", "寒い", "暑い", "涼しい", "重い", "軽い", "強い", "弱い",
        "速い", "遅い", "忙しい", "暇", "簡単", "難しい", "便利", "不便", "安全", "危険",
        
        // 其他
        "材料", "道具", "方法", "理由", "結果", "問題", "答え", "質問", "説明", "例", "練習",
        "宿題", "試験", "成績", "合格", "失敗", "成功", "努力", "頑張る", "応援", "協力"
    ],
    
    chinese: [
        // 动作
        "吃", "喝", "看", "听", "读", "写", "说", "走", "跑", "游泳", "睡觉", "起床",
        "坐", "站", "来", "去", "回家", "出去", "进来", "打开", "关闭", "制作", "购买", "出售",
        "借", "借给", "学习", "教", "记住", "忘记", "想", "考虑", "工作", "休息",
        
        // 物品
        "书", "桌子", "椅子", "窗户", "门", "房间", "家", "学校", "公司", "医院", "车站", "机场",
        "公园", "图书馆", "银行", "邮局", "商店", "餐厅", "咖啡店", "电影院", "美术馆",
        "动物", "狗", "猫", "鸟", "鱼", "花", "树", "山", "河", "海", "天空", "云", "雨", "雪",
        
        // 时间
        "春天", "夏天", "秋天", "冬天", "早晨", "中午", "晚上", "今天", "明天", "昨天",
        "时间", "分钟", "秒", "小时", "星期", "月", "年", "现在", "以前", "以后",
        
        // 形容词
        "大", "小", "高", "低", "长", "短", "宽", "窄", "新", "旧", "美丽", "脏",
        "温暖", "寒冷", "炎热", "凉爽", "重", "轻", "强", "弱", "快", "慢", "忙", "闲",
        "简单", "困难", "方便", "不便", "安全", "危险", "有趣", "无聊", "重要", "普通",
        
        // 其他
        "材料", "工具", "方法", "理由", "结果", "问题", "答案", "问题", "说明", "例子",
        "练习", "作业", "考试", "成绩", "合格", "失败", "成功", "努力", "加油", "合作"
    ]
};

// 获取替换词
function getReplacementWord(type, usedWords, originalWord) {
    const pool = replacementPools[type];
    const availableWords = pool.filter(word => 
        !usedWords.has(word) && 
        word !== originalWord &&
        !originalWord.includes(word) &&
        !word.includes(originalWord)
    );
    
    if (availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex];
    }
    
    // 如果没有可用词，返回一个通用词
    return type === 'japanese' ? '材料' : '材料';
}

// 修复单个单词的干扰项
function fixWordDistractors(wordData) {
    const issues = checkWordDistractors(wordData);
    let fixedCount = 0;
    
    if (issues.length === 0) {
        return 0;
    }
    
    // 收集已使用的词汇
    const usedJapanese = new Set(wordData.日语干扰词 || []);
    const usedChinese = new Set(wordData.中文干扰词 || []);
    
    // 添加主词到已使用集合
    usedJapanese.add(wordData.汉字 || wordData.假名);
    usedChinese.add(wordData.中文);
    
    issues.forEach(issue => {
        if (issue.type === 'chinese_identical' || issue.type === 'chinese_duplicate') {
            const replacement = getReplacementWord('chinese', usedChinese, wordData.中文);
            wordData.中文干扰词[issue.index] = replacement;
            usedChinese.add(replacement);
            fixedCount++;
        } else if (issue.type === 'japanese_identical' || issue.type === 'japanese_duplicate') {
            const replacement = getReplacementWord('japanese', usedJapanese, wordData.汉字 || wordData.假名);
            wordData.日语干扰词[issue.index] = replacement;
            usedJapanese.add(replacement);
            fixedCount++;
        }
    });
    
    return fixedCount;
}

// 处理单个文件
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // 创建备份
        const backupPath = filePath.replace('.json', '_backup.json');
        fs.writeFileSync(backupPath, content, 'utf8');
        
        let totalFixed = 0;
        let wordsWithIssues = 0;
        
        data.forEach((item, index) => {
            if (item.data) {
                const issuesBefore = checkWordDistractors(item.data);
                if (issuesBefore.length > 0) {
                    wordsWithIssues++;
                    const fixed = fixWordDistractors(item.data);
                    totalFixed += fixed;
                    
                    if (fixed > 0) {
                        console.log(`   修复单词 ${index + 1}: ${item.data.假名}(${item.data.汉字}) - ${item.data.中文} (${fixed}个问题)`);
                    }
                }
            }
        });
        
        // 保存修改后的文件
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        return {
            totalFixed,
            wordsWithIssues,
            modified: totalFixed > 0
        };
        
    } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error.message);
        return { totalFixed: 0, wordsWithIssues: 0, modified: false };
    }
}

// 主函数
function main() {
    const everyonesJapaneseIntermediateDir = path.join(__dirname, '../../everyones_japanese_intermediate');
    
    console.log('🔧 开始优化 everyones_japanese_intermediate 中的干扰项...\n');
    
    if (!fs.existsSync(everyonesJapaneseIntermediateDir)) {
        console.error('❌ everyones_japanese_intermediate 目录不存在');
        return;
    }
    
    const files = fs.readdirSync(everyonesJapaneseIntermediateDir)
        .filter(file => file.endsWith('.json') && !file.includes('backup'))
        .sort();
    
    console.log(`📁 处理 ${files.length} 个文件\n`);
    
    let totalFilesProcessed = 0;
    let totalFilesModified = 0;
    let totalProblemsFixed = 0;
    let totalWordsWithIssues = 0;
    
    files.forEach(file => {
        console.log(`正在处理文件: ${file}`);
        const filePath = path.join(everyonesJapaneseIntermediateDir, file);
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
    
    console.log('📊 优化完成:');
    console.log(`   处理文件数: ${totalFilesProcessed}`);
    console.log(`   修改文件数: ${totalFilesModified}`);
    console.log(`   修复单词数: ${totalWordsWithIssues}`);
    console.log(`   解决问题数: ${totalProblemsFixed}`);
    
    if (totalProblemsFixed > 0) {
        console.log('\n✨ 干扰项优化成功完成！');
    } else {
        console.log('\n✅ 所有文件都没有问题！');
    }
}

// 运行主函数
main();