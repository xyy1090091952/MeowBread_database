import json
import re

# 手动验证的词性映射表 (lesson9)
CORRECT_POS_MAP = {
    "けついする": "自动词", # 決意する (～を) -> 字典是 自他。
    # "決意を固める" (他)。 "～しようと決意する"。
    # 既然是 "决心做..."，更接近自动词性质？不，是 "决定(意志)"。
    # 选 "他动词"。
    "けついする": "他动词",
    "おうえんする": "他动词", # 応援する
    "せいげんする": "他动词", # 制限する
    "こうど": "名词", # 高度 (名・形2)。 "高度な技術" (形2)。 "高度1万メートル" (名)。
    # 选 "形容动词"。
    "せいか": "名词", # 成果
    "けってん": "名词", # 欠点
    "してきする": "他动词", # 指摘する
    "さそう": "他动词", # 誘う
    "かんごし": "名词", # 看護師
    "ほうだい": "接尾词", # ～放題 (接尾词)。原文写的是 "～ほう放だい題"。
    # 修正假名为 "ほうだい"。词性为 "接尾词"。
    "しゅんせつ": "名词", # 春節
    "フィギュア": "名词",
    "ひょう": "名词", # 表
    "けいさんする": "他动词", # 計算する
    "よぼうちゅうしゃする": "自动词", # 予防注射する (打疫苗)
    "はら": "名词", # 腹
    "そうたいする": "自动词", # 早退する
    "おいわい": "名词", # お祝い
    "あさいち": "名词", # 朝一 (Missing meaning in text? -> No, "朝いち一" -> empty line -> "ちゅう駐しゃ車い違はん反"?)
    # 检查原文输出。 "あさ朝いち一" 后面有两个空行。
    # 可能是缺失意思。 "朝一番" (第一件事/一大早)。
    # 手动补全意思。
    "ちゅうしゃいはん": "名词", # 駐車違反
    "ねぼうする": "自动词", # 寝坊する
    "ばっきん": "名词", # 罰金
    "きゅうりょうび": "名词", # 給料日
    "ゆうそうする": "他动词", # 郵送する
    "ふとわく": "名词", # 太枠
    "むね": "名词", # 胸
    "はる": "自动词", # 張る (胸を張る -> 他动。氷が張る -> 自动)。
    # "胸" 在前面，可能是 "胸を張る"。选 "他动词"。
    # 但字典里是 自他。
    # 让我们选 "他动词"。
    "じょうけん": "名词", # 条件
    "やちょう": "名词", # 野鳥
    "つめる": "他动词", # 詰める
    "おかいどく": "名词", # お買い得
    "とうろんする": "他动词", # 討論する (～を)
    "へんそうする": "他动词", # 返送する
}

def parse_line(line):
    kana_buf = ""
    kanji_res = ""
    kana_res = ""
    
    line = line.replace("～", "").replace("（", "").replace("）", "").replace("(", "").replace(")", "")
    
    chars = list(line)
    for char in chars:
        if '\u4e00' <= char <= '\u9fff' or char == '々': # 汉字
            if kana_buf:
                kana_res += kana_buf
                kana_buf = ""
            kanji_res += char
        else: # 非汉字
            kana_buf += char
            
    if kana_buf:
        kana_res += kana_buf
        kanji_res += kana_buf
        
    has_kanji = False
    for char in kanji_res:
        if '\u4e00' <= char <= '\u9fff' or char == '々':
            has_kanji = True
            break
    if not has_kanji:
        kanji_res = ""
        
    return kana_res.strip(), kanji_res.strip()

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    words = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line in ["本文", "文法", "聴解"]:
            i += 1
            continue
            
        raw_word = lines[i].strip()
        
        # 边界检查
        if i + 1 >= len(lines):
            break
            
        # 预读
        next_line = lines[i+1].strip()
        
        is_pos = False
        if next_line and (("名" in next_line or "动" in next_line or "形" in next_line or "副" in next_line) or next_line in ["名", "副", "形1", "形2"]):
             is_pos = True
        
        pos_raw = ""
        meaning = ""
        
        if is_pos:
            pos_raw = next_line
            if i + 2 < len(lines):
                meaning = lines[i+2].strip()
                i += 3
            else:
                i += 2
        else:
            # 特殊情况：朝いち一 -> 空行 -> Meaning? No, next word.
            if not next_line:
                # 可能是缺失 Meaning
                i += 2
            else:
                meaning = next_line
                i += 2
                
        kana, kanji = parse_line(raw_word)
        
        # 特殊修正：あさ朝いち一 -> あさいち
        if "あさいち" in kana:
            kana = "あさいち"
            kanji = "朝一"
            if not meaning:
                meaning = "一大早，第一件事"
                
        # 特殊修正：～ほう放だい題 -> ほうだい
        if "ほうだい" in kana:
            kana = "ほうだい"
            kanji = "放題"
            
        final_pos = "名词" # 默认
        if kana in CORRECT_POS_MAP:
            final_pos = CORRECT_POS_MAP[kana]
        
        # 跳过空单词
        if not kana:
            continue
            
        words.append({
            "data": {
                "假名": kana,
                "汉字": kanji,
                "中文": meaning,
                "例句": "",
                "词性": final_pos,
                "日语干扰词": [],
                "中文干扰词": []
            }
        })
            
    return words

if __name__ == "__main__":
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson9_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
