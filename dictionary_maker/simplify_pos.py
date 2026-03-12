import json

# 优先级规则：
# 如果包含 "他动词"，优先使用 "他动词"（因为通常意味着有动作对象，更具动词特征）
# 如果包含 "自动词"，次之。
# 如果是 "名词、自动词" 或 "名词、他动词"：
#   - 如果它是 suru 动词（サ变），通常核心用法是动词。
#   - 但如果原文写的是 "名・动3"，说明既是名词也是动词。
#   - 既然用户要求 "只保留最符合的一个"，我们需要一个策略。
#   - 对于 サ变动词 (xxする)，通常我们希望学习者知道它是动词，所以优先保留 "他动词" 或 "自动词"。
#   - 如果只有 "名词"，则保留 "名词"。

def simplify_pos(pos):
    if "、" not in pos:
        return pos
        
    parts = pos.split("、")
    
    # 策略：优先动词性
    if "他动词" in parts:
        return "他动词"
    if "自动词" in parts:
        return "自动词"
    if "名词" in parts:
        return "名词"
    if "形容词" in parts:
        return "形容词"
    if "形容动词" in parts:
        return "形容动词"
        
    return parts[0] # 默认返回第一个

def fix_lesson3_simplify_pos(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    count = 0
    for item in data:
        original_pos = item['data']['词性']
        new_pos = simplify_pos(original_pos)
        if original_pos != new_pos:
            item['data']['词性'] = new_pos
            count += 1
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Simplified {count} items in {file_path}")

if __name__ == "__main__":
    fix_lesson3_simplify_pos("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/try_n2/lesson3.json")
