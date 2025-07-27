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
        console.error(`验证文件 ${filePath} 时出错:`, error.message);
        return 0;
    }
}

// 主函数
function main() {
    const liangsIntermediateDir = path.join(__dirname, '../../liangs_intermediate');
    
    console.log('🔍 验证 liangs_intermediate 中的干扰项修复效果...\n');
    
    if (!fs.existsSync(liangsIntermediateDir)) {
        console.error('❌ liangs_intermediate 目录不存在');
        return;
    }
    
    const files = fs.readdirSync(liangsIntermediateDir)
        .filter(file => file.endsWith('.json') && !file.includes('backup'))
        .sort();
    
    console.log(`📁 检查 ${files.length} 个文件\n`);
    
    let totalIssuesCount = 0;
    
    files.forEach(file => {
        console.log(`正在验证文件: ${file}`);
        const filePath = path.join(liangsIntermediateDir, file);
        const issueCount = validateFile(filePath);
        
        if (issueCount === 0) {
            console.log(`   ✅ 没有发现问题`);
        } else {
            console.log(`   ⚠️  发现 ${issueCount} 个问题`);
        }
        
        totalIssuesCount += issueCount;
        console.log('');
    });
    
    console.log('📊 验证完成:');
    console.log(`   检查文件数: ${files.length}`);
    console.log(`   剩余问题数: ${totalIssuesCount}`);
    
    if (totalIssuesCount === 0) {
        console.log('\n✅ 所有问题都已修复！');
    } else {
        console.log('\n⚠️  还有一些问题需要进一步处理');
    }
}

// 运行主函数
main();