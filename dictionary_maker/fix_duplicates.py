import json
import random

# 通用的日语假名替换词库 (简单模拟，实际应用中可以更丰富)
# 这里仅作为 fallback，当生成的干扰词与原词重复时使用
BACKUP_DISTRACTORS_JA = [
    "あした", "あさって", "いつか", "どこか", "なにか", "だれか",
    "りんご", "みかん", "バナナ", "ぶどう", "いちご", "メロン",
    "つくえ", "いす", "ほん", "ノート", "ペン", "えんぴつ",
    "くるま", "でんしゃ", "バス", "タクシー", "ひこうき", "ふね",
    "がっこう", "かいしゃ", "びょういん", "ぎんこう", "ゆうびんきょく", "えき",
    "せんせい", "がくせい", "いしゃ", "かんごし", "けいさつかん", "しょうぼうし"
]

BACKUP_DISTRACTORS_ZH = [
    "明天", "后天", "某时", "某地", "某物", "某人",
    "苹果", "橘子", "香蕉", "葡萄", "草莓", "甜瓜",
    "桌子", "椅子", "书", "笔记", "笔", "铅笔",
    "汽车", "电车", "巴士", "出租", "飞机", "船",
    "学校", "公司", "医院", "银行", "邮局", "车站",
    "老师", "学生", "医生", "护士", "警察", "消防"
]

def fix_duplicates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    count = 0
    for item in data:
        word_data = item['data']
        kana = word_data['假名']
        kanji = word_data['汉字']
        meaning = word_data['中文']
        
        ja_distractors = word_data['日语干扰词']
        zh_distractors = word_data['中文干扰词']
        
        # 检查日语干扰词
        new_ja_distractors = []
        for d in ja_distractors:
            if d == kana or d == kanji:
                print(f"Found duplicate JA distractor in {file_path}: {d} for word {kana}")
                # 替换为随机备份词，确保不重复
                while True:
                    new_d = random.choice(BACKUP_DISTRACTORS_JA)
                    if new_d != kana and new_d != kanji and new_d not in new_ja_distractors and new_d not in ja_distractors:
                        new_ja_distractors.append(new_d)
                        break
                count += 1
            else:
                new_ja_distractors.append(d)
        word_data['日语干扰词'] = new_ja_distractors
        
        # 检查中文干扰词
        new_zh_distractors = []
        for d in zh_distractors:
            if d == meaning:
                print(f"Found duplicate ZH distractor in {file_path}: {d} for word {meaning}")
                # 替换为随机备份词
                while True:
                    new_d = random.choice(BACKUP_DISTRACTORS_ZH)
                    if new_d != meaning and new_d not in new_zh_distractors and new_d not in zh_distractors:
                        new_zh_distractors.append(new_d)
                        break
                count += 1
            else:
                new_zh_distractors.append(d)
        word_data['中文干扰词'] = new_zh_distractors

    if count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Fixed {count} duplicates in {file_path}")
    else:
        print(f"No duplicates found in {file_path}")

if __name__ == "__main__":
    files = [
        "/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/try_n2/lesson5.json",
        "/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/try_n2/lesson6.json",
        "/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/try_n2/lesson7.json"
    ]
    for f in files:
        fix_duplicates(f)
