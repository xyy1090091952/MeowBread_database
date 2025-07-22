# 日语单词同步脚本需求文档

## 项目背景
需要将 `/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/lesson1.md` 中的单词数据与 `/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/everyones_japanese_intermediate/lesson1.json` 进行校对和同步。

## 输入文件格式

### lesson1.md 格式
- 每3行为一个单词的完整信息
- 第1行：假名（必填）
- 第2行：汉字（可为空）
- 第3行：中文翻译（可为空）
- 空行表示该字段为空值
- 前3行为标题行，需要跳过

示例：
```
假名
汉字
中文
どのように

怎样地
まよう
迷う
拿不定主意、迷路
```

### lesson1.json 格式
- JSON数组格式
- 每个元素包含data对象
- data对象结构：
  ```json
  {
    "data": {
      "假名": "string",
      "汉字": "string",
      "中文": "string",
      "例句": "string",
      "词性": "string",
      "日语干扰词": ["string"],
      "中文干扰词": ["string"]
    }
  }
  ```

## 同步规则

### 校对规则
1. **主键匹配**：以假名作为唯一标识符
2. **数据优先级**：lesson1.md中的数据优先
3. **字段更新**：
   - 假名：作为标识符，不更新
   - 汉字：按lesson1.md更新，空值表示无汉字
   - 中文：按lesson1.md更新

### 插入规则
1. **新增单词**：lesson1.md中存在但lesson1.json中不存在的单词
2. **插入位置**：保持原有顺序，新增单词追加到数组末尾
3. **默认值**：
   - 例句：空字符串
   - 词性：空字符串
   - 日语干扰词：空数组
   - 中文干扰词：空数组

### 特殊处理
1. **汉字字段**：
   - 如果lesson1.md中汉字为空，则JSON中设为""
   - 如果汉字与假名相同，也设为""
2. **空值处理**：lesson1.md中的空行正确映射为JSON中的空字符串

## 输出要求

### 执行结果
- 显示更新统计信息：
  - 更新单词数量
  - 新增单词数量
  - 总单词数量

### 日志输出
- 每个更新/新增操作的详细日志
- 错误处理和提示信息

### 文件备份
- 在修改前自动创建lesson1.json的备份文件

## 使用方式
```bash
node sync_lesson.js [md文件路径] [json文件路径]
```

## 示例输出
```
同步完成摘要:
更新单词数: 5
新增单词数: 3
总单词数: 85

注意：新增单词需要手动补充以下字段：
- 例句
- 词性
- 日语干扰词
- 中文干扰词
```