import json
import re

# 映射规则
POS_MAPPING = {
    "名": "名词",
    "形1": "一类形容词",
    "形2": "二类形容词",
    "副": "副词",
}

def normalize_pos(pos):
    # 先处理简单的映射
    if pos in POS_MAPPING:
        return POS_MAPPING[pos]
    
    # 处理复杂的动词
    # 动1（自） -> 自动词
    # 动2（他） -> 他动词
    # 动1（自・他） -> 自动词、他动词
    
    # 提取括号内的自他性
    match = re.search(r'（(.*?)）', pos)
    if match:
        transitivity = match.group(1)
        # 将 "自・他" 转换为 "自动词、他动词"
        # 将 "自" 转换为 "自动词"
        # 将 "他" 转换为 "他动词"
        trans_parts = transitivity.split('・')
        normalized_trans = []
        for part in trans_parts:
            if part == '自':
                normalized_trans.append('自动词')
            elif part == '他':
                normalized_trans.append('他动词')
        
        trans_str = "、".join(normalized_trans)
        
        # 判断主体是动词还是名词+动词
        if pos.startswith('名・动'):
            # 名・动3（自） -> 名词、自动词
            return f"名词、{trans_str}"
        elif pos.startswith('动'):
            # 动1（自） -> 自动词
            return trans_str
            
    # 如果没有括号，或者不匹配上述规则，尝试保留原样或进行部分替换
    # 比如 "名・动3" (虽然数据里都有括号)
    
    return pos

def fix_lesson2_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for item in data:
        original_pos = item['data']['词性']
        new_pos = normalize_pos(original_pos)
        item['data']['词性'] = new_pos
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Processed {len(data)} items in {file_path}")

if __name__ == "__main__":
    fix_lesson2_json("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/try_n2/lesson2.json")
