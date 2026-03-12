import json
import re

# 手动验证的词性映射表 (lesson7)
CORRECT_POS_MAP = {
    "きょうかんする": "自动词", # 共感する (～に)
    "ゼミ": "名词", # ゼミナール
    "こだわる": "自动词", # 拘る (～に)
    "けっきょく": "副词", # 結局
    "こんなん": "形容动词", # 困難 (困難な) - Lesson 6 consistency
    "けっこうする": "自动词", # 欠航する
    "しんそつ": "名词", # 新卒
    "しょうすうみんぞく": "名词", # 少数民族
    "さんこう": "名词", # 参考
    "たんい": "名词", # 単位
    "りゅうねんする": "自动词", # 留年する
    "しちゃくする": "他动词", # 試着する (～を) - Fix from file's "自"
    "てつやする": "自动词", # 徹夜する
    "ぜいきん": "名词", # 税金
    "しょうひぜい": "名词", # 消費税
    "ゆるす": "他动词", # 許す (～を)
    "わるぐち": "名词", # 悪口
    "きげん": "名词", # 機嫌
    "にあう": "自动词", # 似合う (～に)
    "いいわけする": "自动词", # 言い訳する
    "いちりゅう": "名词", # 一流 (名・No-adj)
    "こうがい": "名词", # 郊外
    "としん": "名词", # 都心
    "さんざん": "副词", # さんざん (形2・副) -> 副词 (Severely/Terribly)
    "おもいで": "名词", # 思い出 (The file has "思い出の～", I'll strip "の～")
}

def parse_line(line):
    kana_buf = ""
    kanji_res = ""
    kana_res = ""
    
    # 清理特殊字符
    line = line.replace("～", "").replace("（", "").replace("）", "").replace("(", "").replace(")", "").replace("がいい", "")
    
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
            
        # 尝试读取 3 行
        # Word
        # POS (可能为空或缺失)
        # Meaning
        
        raw_word = lines[i].strip()
        
        # 检查是否到了文件末尾
        if i + 1 >= len(lines):
            break
            
        # 预读下一行，判断是否是 POS
        next_line = lines[i+1].strip()
        
        # 判断下一行是否像 POS
        is_pos = False
        if next_line and (("名" in next_line or "动" in next_line or "形" in next_line or "副" in next_line) or next_line in ["名", "副", "形1", "形2"]):
             is_pos = True
        
        pos_raw = ""
        meaning = ""
        
        if is_pos:
            pos_raw = next_line
            if i + 2 < len(lines):
                meaning = lines[i+2].strip()
                i += 3 # 消耗 3 行
            else:
                # 只有 POS 没有 Meaning?
                i += 2
        else:
            # 没有 POS 行，next_line 可能是 Meaning，或者空行
            if not next_line:
                # 空行，再下一行是 Meaning?
                if i + 2 < len(lines):
                    meaning = lines[i+2].strip()
                    i += 3 # 消耗 Word, Empty, Meaning
                else:
                    i += 2
            else:
                # next_line 是 Meaning
                meaning = next_line
                i += 2 # 消耗 Word, Meaning
                
        kana, kanji = parse_line(raw_word)
        
        # 特殊修正：おも思いで出の～ -> おもいで
        if "おもいで" in kana:
            kana = "おもいで"
            kanji = "思い出"
            
        # 特殊修正：いち一りゅう流 -> いちりゅう
        if "いちりゅう" in kana:
            pass # parse_line handles it
            
        # 使用手动映射表修正词性
        final_pos = "名词" # 默认
        if kana in CORRECT_POS_MAP:
            final_pos = CORRECT_POS_MAP[kana]
        else:
            # 如果不在表中，尝试从 pos_raw 解析
            if "动" in pos_raw:
                if "他" in pos_raw:
                    final_pos = "他动词"
                else:
                    final_pos = "自动词"
            elif "形容" in pos_raw or "形" in pos_raw:
                 if "1" in pos_raw:
                     final_pos = "形容词"
                 else:
                     final_pos = "形容动词"
            elif "副" in pos_raw:
                final_pos = "副词"
            
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
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson7_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
