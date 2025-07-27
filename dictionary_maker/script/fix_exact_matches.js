/**
 * 精确修复剩余问题的脚本
 * 专门处理完全相同和重复的干扰项
 */

const fs = require('fs');
const path = require('path');

// 更多替换词库
const chineseReplacements = [
    '物品', '东西', '用品', '器具', '工具', '设备', '装置', '机器', '产品', '商品',
    '方法', '方式', '手段', '途径', '办法', '技巧', '技术', '能力', '技能', '本领',
    '地方', '场所', '位置', '区域', '范围', '空间', '环境', '条件', '情况', '状态',
    '时间', '时刻', '时期', '阶段', '过程', '步骤', '程序', '流程', '顺序', '次序',
    '人员', '人物', '角色', '身份', '职位', '职业', '工作', '任务', '责任', '义务',
    '内容', '材料', '资源', '信息', '数据', '资料', '文件', '文档', '记录', '档案',
    '活动', '行为', '动作', '举动', '表现', '行动', '措施', '政策', '规定', '制度',
    '结果', '效果', '影响', '作用', '功能', '价值', '意义', '目的', '目标', '计划'
];

const japaneseReplacements = [
    '物', '事', '人', '場所', '時', '方法', '手段', '技術', '能力', '機会',
    '問題', '課題', '解決', '改善', '発展', '進歩', '成長', '変化', '移動', '転換',
    '開始', '終了', '完成', '実現', '達成', '成功', '失敗', '困難', '簡単', '複雑',
    '新しい', '古い', '大きい', '小さい', '高い', '低い', '長い', '短い', '広い', '狭い',
    '明るい', '暗い', '美しい', '醜い', '良い', '悪い', '正しい', '間違い', '安全', '危険',
    '自然', '人工', '科学', '技術', '文化', '社会', '政治', '経済', '教育', '医療',
    '家族', '友人', '同僚', '先生', '学生', '子供', '大人', '男性', '女性', '人間'
];

function getRandomReplacement(usedWords, isJapanese = false) {
    const pool = isJapanese ? japaneseReplacements : chineseReplacements;
    const available = pool.filter(word => !usedWords.has(word));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

function fixExactMatches(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        let hasChanges = false;
        const issues = [];
        
        data.forEach((item, index) => {
            const word = item.data;
            const wordInfo = `${word.假名}${word.汉字 ? `(${word.汉字})` : ''} - ${word.中文}`;
            const usedChinese = new Set();
            const usedJapanese = new Set();
            
            // 修复中文干扰项
            const fixedChinese = [];
            word.中文干扰词.forEach(distractor => {
                if (distractor === word.中文) {
                    // 完全相同，需要替换
                    const replacement = getRandomReplacement(usedChinese, false);
                    if (replacement) {
                        fixedChinese.push(replacement);
                        usedChinese.add(replacement);
                        issues.push(`${wordInfo} - 替换中文干扰项: ${distractor} → ${replacement}`);
                        hasChanges = true;
                    } else {
                        fixedChinese.push(distractor);
                    }
                } else if (!usedChinese.has(distractor)) {
                    fixedChinese.push(distractor);
                    usedChinese.add(distractor);
                } else {
                    // 重复项，需要替换
                    const replacement = getRandomReplacement(usedChinese, false);
                    if (replacement) {
                        fixedChinese.push(replacement);
                        usedChinese.add(replacement);
                        issues.push(`${wordInfo} - 替换重复中文干扰项: ${distractor} → ${replacement}`);
                        hasChanges = true;
                    }
                }
            });
            
            // 修复日语干扰项
            const mainJapanese = word.汉字 || word.假名;
            const fixedJapanese = [];
            word.日语干扰词.forEach(distractor => {
                if (distractor === mainJapanese) {
                    // 完全相同，需要替换
                    const replacement = getRandomReplacement(usedJapanese, true);
                    if (replacement) {
                        fixedJapanese.push(replacement);
                        usedJapanese.add(replacement);
                        issues.push(`${wordInfo} - 替换日语干扰项: ${distractor} → ${replacement}`);
                        hasChanges = true;
                    } else {
                        fixedJapanese.push(distractor);
                    }
                } else if (!usedJapanese.has(distractor)) {
                    fixedJapanese.push(distractor);
                    usedJapanese.add(distractor);
                } else {
                    // 重复项，需要替换
                    const replacement = getRandomReplacement(usedJapanese, true);
                    if (replacement) {
                        fixedJapanese.push(replacement);
                        usedJapanese.add(replacement);
                        issues.push(`${wordInfo} - 替换重复日语干扰项: ${distractor} → ${replacement}`);
                        hasChanges = true;
                    }
                }
            });
            
            // 确保有6个干扰项
            while (fixedChinese.length < 6) {
                const replacement = getRandomReplacement(usedChinese, false);
                if (replacement) {
                    fixedChinese.push(replacement);
                    usedChinese.add(replacement);
                } else {
                    break;
                }
            }
            
            while (fixedJapanese.length < 6) {
                const replacement = getRandomReplacement(usedJapanese, true);
                if (replacement) {
                    fixedJapanese.push(replacement);
                    usedJapanese.add(replacement);
                } else {
                    break;
                }
            }
            
            word.中文干扰词 = fixedChinese.slice(0, 6);
            word.日语干扰词 = fixedJapanese.slice(0, 6);
        });
        
        if (hasChanges) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ 修复完成: ${path.basename(filePath)}`);
            if (issues.length > 0) {
                console.log(`   修复项目:`);
                issues.slice(0, 5).forEach(issue => console.log(`     ${issue}`));
                if (issues.length > 5) {
                    console.log(`     ... 还有 ${issues.length - 5} 项修复`);
                }
            }
        } else {
            console.log(`✨ 无需修复: ${path.basename(filePath)}`);
        }
        
        return { hasChanges, issueCount: issues.length };
        
    } catch (error) {
        console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
        return { hasChanges: false, issueCount: 0 };
    }
}

function main() {
    const liangsClassDir = path.join(__dirname, '..', '..', 'liangs_class');
    
    console.log('🔧 精确修复剩余问题...\n');
    
    const files = fs.readdirSync(liangsClassDir)
        .filter(file => file.endsWith('.json') && file.startsWith('lesson') && !file.includes('backup'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
    
    let totalChanges = 0;
    let totalIssues = 0;
    
    files.forEach(file => {
        const filePath = path.join(liangsClassDir, file);
        const result = fixExactMatches(filePath);
        if (result.hasChanges) totalChanges++;
        totalIssues += result.issueCount;
    });
    
    console.log('\n📊 精确修复完成统计:');
    console.log(`   总文件数: ${files.length}`);
    console.log(`   修改文件数: ${totalChanges}`);
    console.log(`   修复问题数: ${totalIssues}`);
    console.log('\n✨ 精确修复完成！');
}

if (require.main === module) {
    main();
}

module.exports = { fixExactMatches, main };