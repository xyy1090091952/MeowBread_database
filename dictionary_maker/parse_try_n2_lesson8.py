import json
import re
import random

# 手动验证的词性映射表 (lesson8)
CORRECT_POS_MAP = {
    "どうき": "名词", # 同期
    "くらべる": "他动词", # 比べる (Missing pos in text)
    "センチ": "名词",
    "きず": "名词", # 傷
    "しじょう": "名词", # 市場
    "かち": "名词", # 価値
    "からかう": "他动词", # (戏弄)
    "ちりょう": "他动词", # 治療 (名・他サ)
    "しんぱん": "名词", # 審判 (名・他サ)。但通常作名词 "審判を下す"。动词用 "審判する" 较少，"審判を行う" 常见。
    # 让我们选 "名词"。
    "こうぎする": "自动词", # 抗議する (～に)
    "さす": "他动词", # 刺す (～を)
    "ふだん": "副词", # 普段 (副・名)。"普段の生活" (名)。"普段から" (副)。
    # N2 常见 "普段は～"。选 "副词" 或 "名词"。
    # 字典通常 名・副。
    # 让我们选 "名词" (Usually)。
    "けいひ": "名词", # 経費
    "にっしょうじかん": "名词", # 日照時間
    "えんじょする": "他动词", # 援助する
    "ぎょうせきふしん": "名词", # 業績不振
    "ことわる": "他动词", # 断る (～を)。原文写 "动1（她）" -> "他"。
    "しつれんする": "自动词", # 失恋する
    "なさけない": "形容词", # 情けない
    "ごかいする": "他动词", # 誤解する
    "れいねん": "名词", # 例年
    "ふそく": "名词", # 不足 (～不足)
    "すいそう": "名词", # 水槽
    "みずくさ": "名词", # 水草
    "せんもんか": "名词", # 専門家
    "かう": "他动词", # 飼う
    "こいし": "名词", # 小石
    "ちょうじょう": "名词", # 頂上
    "じょうほう": "名词", # 情報
    "かっこう": "名词", # 格好
}

def parse_line(line):
    kana_buf = ""
    kanji_res = ""
    kana_res = ""
    
    # 清理
    line = line.replace("～", "").replace("（", "").replace("）", "").replace("(", "").replace(")", "").replace("彼女", "他")
    
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
        
        # 检查边界
        if i + 1 >= len(lines):
            break
            
        # 预读下一行，判断是否是 POS
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
            # 可能是缺失 POS，直接是 meaning
            # 或者 meaning 也是空的 (如 くら比べる)
            # 判断 raw_word 是否是单词
            # 如果 next_line 是空的，且再下一行是单词（或结束），则没有 meaning
            # 如果 next_line 看起来是 meaning
            
            # 特殊处理 "くら比べる" 后面空行，再后面 "文法"
            if not next_line:
                i += 2
            else:
                meaning = next_line
                i += 2
                
        kana, kanji = parse_line(raw_word)
        
        # 特殊修正：～ふ不そく足 -> ふそく
        if "ふそく" in kana:
            kana = "ふそく"
            kanji = "不足"
            
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
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson8_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
