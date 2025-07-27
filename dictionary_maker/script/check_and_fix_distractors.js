/**
 * 检查并修复干扰项问题的脚本
 * 主要解决：
 * 1. 干扰项与本体单词意思相同或高度相似
 * 2. 重复的干扰项
 * 3. 意思过于接近的干扰项
 */

const fs = require('fs');
const path = require('path');

// 定义问题检测规则
const problemPatterns = {
    // 中文同义词检测
    chineseSynonyms: {
        '那么': ['那么', '那', '那个'],
        '总算': ['总算', '终于', '好不容易'],
        '准备': ['准备', '预备', '准备好'],
        '调查': ['调查', '调查问卷', '问卷调查'],
        '草稿': ['草稿', '稿子', '原稿'],
        '新生': ['新生', '新入生', '一年级学生'],
        '一年级学生': ['一年级学生', '新生', '新入生']
    },
    
    // 日语同义词检测
    japaneseSynonyms: {
        'なんとか': ['どうにか', 'やっと', 'ようやく'],
        'どうにか': ['なんとか', 'やっと', 'ようやく'],
        '新入生': ['一年生', '新入生'],
        '一年生': ['新入生', '一年生'],
        '下書き': ['草稿', '原稿'],
        '草稿': ['下書き', '原稿']
    }
};

// 替换建议
const replacementSuggestions = {
    chinese: {
        '那么': ['好吧', '算了', '行吧', '可以', '不错', '还行'],
        '总算': ['肯定', '一定', '必须', '应该', '可能', '或许'],
        '准备': ['装备', '配备', '设置', '布置', '摆放', '放置'],
        '调查': ['询问', '咨询', '请教', '了解', '打听', '探听'],
        '草稿': ['文本', '文档', '材料', '内容', '素材', '资源'],
        '新生': ['学员', '学子', '同学', '学者', '研究生', '毕业生'],
        '一年级学生': ['学员', '学子', '同学', '学者', '研究生', '毕业生']
    },
    japanese: {
        'どうにか': ['きっと', 'たぶん', 'もしかして', 'おそらく', 'まさか', 'まさに'],
        '新入生': ['卒業生', '研究生', '留学生', '社会人', '先輩', '後輩'],
        '一年生': ['卒業生', '研究生', '留学生', '社会人', '先輩', '後輩'],
        '下書き': ['完成品', '清書', '印刷物', '出版物', '書籍', '雑誌'],
        '草稿': ['完成品', '清書', '印刷物', '出版物', '書籍', '雑誌']
    }
};

function checkAndFixFile(filePath) {
    console.log(`\n🔍 检查文件: ${filePath}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        let hasChanges = false;
        const issues = [];
        
        data.forEach((item, index) => {
            const word = item.data;
            const wordInfo = `${word.假名}${word.汉字 ? `(${word.汉字})` : ''} - ${word.中文}`;
            
            // 检查中文干扰项
            const chineseIssues = checkDistractors(word.中文, word.中文干扰词, 'chinese');
            if (chineseIssues.length > 0) {
                issues.push(`单词 ${index + 1}: ${wordInfo}`);
                issues.push(`  中文干扰项问题: ${chineseIssues.join(', ')}`);
                
                // 修复中文干扰项
                word.中文干扰词 = fixDistractors(word.中文, word.中文干扰词, 'chinese');
                hasChanges = true;
            }
            
            // 检查日语干扰项
            const mainJapanese = word.汉字 || word.假名;
            const japaneseIssues = checkDistractors(mainJapanese, word.日语干扰词, 'japanese');
            if (japaneseIssues.length > 0) {
                issues.push(`单词 ${index + 1}: ${wordInfo}`);
                issues.push(`  日语干扰项问题: ${japaneseIssues.join(', ')}`);
                
                // 修复日语干扰项
                word.日语干扰词 = fixDistractors(mainJapanese, word.日语干扰词, 'japanese');
                hasChanges = true;
            }
            
            // 检查重复项
            const duplicates = findDuplicates(word.中文干扰词.concat(word.日语干扰词));
            if (duplicates.length > 0) {
                issues.push(`单词 ${index + 1}: ${wordInfo}`);
                issues.push(`  重复干扰项: ${duplicates.join(', ')}`);
                
                // 去重
                word.中文干扰词 = [...new Set(word.中文干扰词)];
                word.日语干扰词 = [...new Set(word.日语干扰词)];
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            // 创建备份
            const backupPath = filePath.replace('.json', '_backup.json');
            fs.writeFileSync(backupPath, content);
            console.log(`📁 已创建备份: ${backupPath}`);
            
            // 保存修复后的文件
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ 已修复并保存: ${filePath}`);
            
            if (issues.length > 0) {
                console.log(`📋 发现的问题:`);
                issues.forEach(issue => console.log(`   ${issue}`));
            }
        } else {
            console.log(`✨ 文件无问题: ${filePath}`);
        }
        
        return { hasChanges, issues: issues.length };
        
    } catch (error) {
        console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
        return { hasChanges: false, issues: 0 };
    }
}

function checkDistractors(mainWord, distractors, language) {
    const issues = [];
    const synonyms = language === 'chinese' ? problemPatterns.chineseSynonyms : problemPatterns.japaneseSynonyms;
    
    distractors.forEach(distractor => {
        // 检查是否与主词相同
        if (distractor === mainWord) {
            issues.push(`与主词相同: ${distractor}`);
        }
        
        // 检查是否为已知同义词
        if (synonyms[mainWord] && synonyms[mainWord].includes(distractor)) {
            issues.push(`同义词: ${distractor}`);
        }
        
        // 检查是否包含主词
        if (distractor.includes(mainWord) || mainWord.includes(distractor)) {
            if (distractor !== mainWord) {
                issues.push(`包含关系: ${distractor}`);
            }
        }
    });
    
    return issues;
}

function fixDistractors(mainWord, distractors, language) {
    const suggestions = language === 'chinese' ? replacementSuggestions.chinese : replacementSuggestions.japanese;
    const synonyms = language === 'chinese' ? problemPatterns.chineseSynonyms : problemPatterns.japaneseSynonyms;
    
    const fixed = [];
    const used = new Set();
    
    distractors.forEach(distractor => {
        let shouldReplace = false;
        
        // 检查是否需要替换
        if (distractor === mainWord) {
            shouldReplace = true;
        } else if (synonyms[mainWord] && synonyms[mainWord].includes(distractor)) {
            shouldReplace = true;
        } else if (distractor.includes(mainWord) || mainWord.includes(distractor)) {
            if (distractor !== mainWord) {
                shouldReplace = true;
            }
        }
        
        if (shouldReplace && suggestions[mainWord]) {
            // 找一个未使用的替换词
            const replacement = suggestions[mainWord].find(s => !used.has(s) && !fixed.includes(s));
            if (replacement) {
                fixed.push(replacement);
                used.add(replacement);
            } else {
                // 如果没有合适的替换词，保留原词但标记
                fixed.push(distractor);
            }
        } else if (!used.has(distractor)) {
            fixed.push(distractor);
            used.add(distractor);
        }
    });
    
    // 确保有6个干扰项
    while (fixed.length < 6) {
        const allSuggestions = Object.values(suggestions).flat();
        const unused = allSuggestions.find(s => !used.has(s) && !fixed.includes(s));
        if (unused) {
            fixed.push(unused);
            used.add(unused);
        } else {
            break;
        }
    }
    
    return fixed.slice(0, 6);
}

function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = new Set();
    
    arr.forEach(item => {
        if (seen.has(item)) {
            duplicates.add(item);
        } else {
            seen.add(item);
        }
    });
    
    return Array.from(duplicates);
}

// 主函数
function main() {
    const liangsClassDir = path.join(__dirname, '..', '..', 'liangs_class');
    
    console.log('🚀 开始检查和修复 liangs_class 中的干扰项问题...\n');
    
    if (!fs.existsSync(liangsClassDir)) {
        console.error('❌ liangs_class 目录不存在');
        return;
    }
    
    const files = fs.readdirSync(liangsClassDir)
        .filter(file => file.endsWith('.json') && file.startsWith('lesson'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
    
    let totalChanges = 0;
    let totalIssues = 0;
    
    files.forEach(file => {
        const filePath = path.join(liangsClassDir, file);
        const result = checkAndFixFile(filePath);
        if (result.hasChanges) totalChanges++;
        totalIssues += result.issues;
    });
    
    console.log('\n📊 检查完成统计:');
    console.log(`   总文件数: ${files.length}`);
    console.log(`   修改文件数: ${totalChanges}`);
    console.log(`   发现问题数: ${totalIssues}`);
    console.log('\n✨ 所有文件检查完成！');
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { checkAndFixFile, main };