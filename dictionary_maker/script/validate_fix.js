/**
 * 验证修复效果的脚本
 * 检查是否还有明显的同义词问题
 */

const fs = require('fs');
const path = require('path');

function validateFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const issues = [];
        
        data.forEach((item, index) => {
            const word = item.data;
            const wordInfo = `${word.假名}${word.汉字 ? `(${word.汉字})` : ''} - ${word.中文}`;
            
            // 检查中文干扰项是否与主词完全相同
            word.中文干扰词.forEach(distractor => {
                if (distractor === word.中文) {
                    issues.push(`单词 ${index + 1}: ${wordInfo} - 中文干扰项与主词相同: ${distractor}`);
                }
            });
            
            // 检查日语干扰项是否与主词完全相同
            const mainJapanese = word.汉字 || word.假名;
            word.日语干扰词.forEach(distractor => {
                if (distractor === mainJapanese) {
                    issues.push(`单词 ${index + 1}: ${wordInfo} - 日语干扰项与主词相同: ${distractor}`);
                }
            });
            
            // 检查重复项
            const allDistractors = [...word.中文干扰词, ...word.日语干扰词];
            const duplicates = allDistractors.filter((item, index) => allDistractors.indexOf(item) !== index);
            if (duplicates.length > 0) {
                issues.push(`单词 ${index + 1}: ${wordInfo} - 重复干扰项: ${[...new Set(duplicates)].join(', ')}`);
            }
        });
        
        return issues;
        
    } catch (error) {
        return [`文件读取错误: ${error.message}`];
    }
}

function main() {
    const liangsClassDir = path.join(__dirname, '..', '..', 'liangs_class');
    
    console.log('🔍 验证修复效果...\n');
    
    const files = fs.readdirSync(liangsClassDir)
        .filter(file => file.endsWith('.json') && file.startsWith('lesson') && !file.includes('backup'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
    
    let totalIssues = 0;
    
    files.forEach(file => {
        const filePath = path.join(liangsClassDir, file);
        const issues = validateFile(filePath);
        
        if (issues.length > 0) {
            console.log(`❌ ${file}:`);
            issues.forEach(issue => console.log(`   ${issue}`));
            console.log();
            totalIssues += issues.length;
        } else {
            console.log(`✅ ${file}: 无问题`);
        }
    });
    
    console.log(`\n📊 验证完成:`);
    console.log(`   检查文件数: ${files.length}`);
    console.log(`   剩余问题数: ${totalIssues}`);
    
    if (totalIssues === 0) {
        console.log('\n🎉 所有明显的同义词问题已修复！');
    } else {
        console.log('\n⚠️  还有一些问题需要进一步处理');
    }
}

if (require.main === module) {
    main();
}

module.exports = { validateFile, main };