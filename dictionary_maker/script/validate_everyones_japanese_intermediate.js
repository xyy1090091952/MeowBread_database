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
            if (mainChinese === distractor) {
                issues.push({
                    type: 'chinese_identical',
                    distractor: distractor
                });
            }
        });
        
        // 检查重复项
        const seen = new Set();
        wordData.中文干扰词.forEach(distractor => {
            if (seen.has(distractor)) {
                issues.push({
                    type: 'chinese_duplicate',
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
            if (mainJapanese === distractor) {
                issues.push({
                    type: 'japanese_identical',
                    distractor: distractor
                });
            }
        });
        
        // 检查重复项
        const seen = new Set();
        wordData.日语干扰词.forEach(distractor => {
            if (seen.has(distractor)) {
                issues.push({
                    type: 'japanese_duplicate',
                    distractor: distractor
                });
            }
            seen.add(distractor);
        });
    }
    
    return issues;
}

// 处理单个文件
function validateFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查文件是否为空
        if (!content.trim()) {
            console.log(`   ⚠️  文件为空`);
            return 0;
        }
        
        const data = JSON.parse(content);
        
        let totalIssues = 0;
        
        data.forEach((item, wordIndex) => {
            if (item.data) {
                const issues = checkWordDistractors(item.data);
                if (issues.length > 0) {
                    console.log(`   单词 ${wordIndex + 1}: ${item.data.假名}(${item.data.汉字}) - ${item.data.中文}`);
                    
                    const identicalIssues = issues.filter(i => i.type.includes('identical'));
                    const duplicateIssues = issues.filter(i => i.type.includes('duplicate'));
                    
                    if (identicalIssues.length > 0) {
                        const identicalWords = identicalIssues.map(i => i.distractor).join(', ');
                        console.log(`     相同干扰项: ${identicalWords}`);
                    }
                    
                    if (duplicateIssues.length > 0) {
                        const duplicateWords = [...new Set(duplicateIssues.map(i => i.distractor))].join(', ');
                        console.log(`     重复干扰项: ${duplicateWords}`);
                    }
                    
                    totalIssues += issues.length;
                }
            }
        });
        
        return totalIssues;
        
    } catch (error) {
        console.log(`   ❌ JSON格式错误: ${error.message}`);
        return 0;
    }
}

// 主函数
function main() {
    const everyonesJapaneseIntermediateDir = path.join(__dirname, '../../everyones_japanese_intermediate');
    
    console.log('🔍 验证 everyones_japanese_intermediate 中的干扰项修复效果...\n');
    
    if (!fs.existsSync(everyonesJapaneseIntermediateDir)) {
        console.error('❌ everyones_japanese_intermediate 目录不存在');
        return;
    }
    
    const files = fs.readdirSync(everyonesJapaneseIntermediateDir)
        .filter(file => file.endsWith('.json') && !file.includes('backup'))
        .sort();
    
    console.log(`📁 检查 ${files.length} 个文件\n`);
    
    let totalIssuesCount = 0;
    let validFiles = 0;
    let emptyFiles = 0;
    let errorFiles = 0;
    
    files.forEach(file => {
        console.log(`正在验证文件: ${file}`);
        const filePath = path.join(everyonesJapaneseIntermediateDir, file);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.trim()) {
                console.log(`   ⚠️  文件为空`);
                emptyFiles++;
                console.log('');
                return;
            }
            
            const issueCount = validateFile(filePath);
            
            if (issueCount === 0) {
                console.log(`   ✅ 没有发现问题`);
                validFiles++;
            } else {
                console.log(`   ⚠️  发现 ${issueCount} 个问题`);
            }
            
            totalIssuesCount += issueCount;
        } catch (error) {
            console.log(`   ❌ 文件读取错误: ${error.message}`);
            errorFiles++;
        }
        
        console.log('');
    });
    
    console.log('📊 验证完成:');
    console.log(`   检查文件数: ${files.length}`);
    console.log(`   有效文件数: ${validFiles}`);
    console.log(`   空文件数: ${emptyFiles}`);
    console.log(`   错误文件数: ${errorFiles}`);
    console.log(`   剩余问题数: ${totalIssuesCount}`);
    
    if (totalIssuesCount === 0 && emptyFiles === 0 && errorFiles === 0) {
        console.log('\n✅ 所有问题都已修复！');
    } else if (emptyFiles > 0 || errorFiles > 0) {
        console.log('\n⚠️  有一些文件需要检查');
    } else {
        console.log('\n⚠️  还有一些问题需要进一步处理');
    }
}

// 运行主函数
main();