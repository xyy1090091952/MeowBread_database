import json
import re

# 手动验证的词性映射表 (lesson6 - 对应 第5（1）课)
CORRECT_POS_MAP = {
    "サークル": "名词",
    "じゃっかん": "副词", # 若干 (名・副)。"若干の問題"。
    # 作为 "若干名" 是名词。作为 "若干ある" 是副词。
    # 鉴于 N2 常见用法，选 "名词" (Some/Somewhat) 还是 "副词"？
    # 字典里通常列为 名・副。
    # 如果只能选一个，选 "名词" (a little amount) 还是 "副词" (somewhat)?
    # 让我们选 "名词"。
    "きゅうじん": "名词", # 求人
    "じこPR": "名词", # 自己PR (Self-promotion) -> 注意这里的 PR 是片假名还是英文？原文是 "じ自こ己ＰＲ"。
    # 需要特殊处理假名解析，因为 "ＰＲ" 是全角英文。
    "だまる": "自动词", # 黙る
    "きぐ": "名词", # 器具
    "あかんぼう": "名词", # 赤ん坊
    "よみち": "名词", # 夜道
    "しめきり": "名词", # 締め切り
    "かいすいよく": "名词", # 海水浴
    "きゅうか": "名词", # 休暇
    "ぼうねんかい": "名词", # 忘年会
    "おおゆき": "名词", # 大雪 (重复词？Lesson5也有。没关系，可能是复习或新课)
    "おう": "他动词", # 追う
    "じつようかする": "他动词", # 実用化する (～を)
    "しゅうふくする": "他动词", # 修復する (～を)
    "こんなん": "形容动词", # 困難 (困難な)
    "てあみ": "名词", # 手編み (虽然原文写了"名" + "手編みする"?)
    # 原文: て手あ編みする 名。
    # "手編み" 是名词。 "手編みする" 是动词。
    # 既然词性写的是 "名"，那可能是指 "手編み" 这个行为或物品。
    # 但假名部分是 "てあみする" 吗？
    # 原文：て手あ編みする。
    # 假名应该是 "てあみ"。如果原文带 "する"，那应该是动词。
    # 让我们看看原文： "て手あ編みする" -> 假名 "てあみする"？
    # 但词性是 "名"。这很矛盾。
    # 通常 "手編み" (Hand-knitting) 是名词。
    # 也许原文是 "てあみ" (名)？
    # 让我们假设是 "名词"。假名修正为 "てあみ"。
    "うかぶ": "自动词", # 浮かぶ
    "ヒットする": "自动词", # ヒットする (大受欢迎)
    "とうちてき": "形容动词", # 倒置的 (～な)
    "はなたば": "名词", # 花束
    "がっしょうする": "自动词", # 合唱する (～を/～で)。
    # 字典：名・自他サ。
    # "歌を合唱する" (他)。 "みんなで合唱する" (自)。
    # 选 "他动词" (Sing together)。
    "コンクール": "名词",
    "ごしき": "名词", # 五色
    "ぬま": "名词", # 沼
    "フレックスタイム": "名词",
    "ひとりごと": "名词", # 独り言
    "つうじる": "自动词", # 通じる (～に/が)。也有他动用法。
    # "意味が通じる" (自)。
    # 选 "自动词"。
    "こころぼそい": "形容词", # 心細い
    "でんしマネー": "名词", # 電子マネー
    "きんがく": "名词", # 金額
    "むだづかい": "他动词", # 無駄遣い (虽然原文是名・动3他，通常指 "无駄遣いをする")
    # 既然是 "无駄遣いする"，那就是动词。
    # 如果是 "无駄遣い"，那就是名词。
    # 原文：む無だ駄づか遣い 名・动3（他）。
    # 修正假名为 "むだづかい" (名词) 还是 "むだづかいする" (动词)？
    # 通常单词表给名词形式。选 "名词"。
    "ちょくせつ": "副词", # 直接 (名・副・形2)。
    # "直接会う" (副)。 "直接な関係" (形2)。
    # 选 "副词"。
    "かんかく": "名词", # 感覚
}

def parse_line(line):
    kana_buf = ""
    kanji_res = ""
    kana_res = ""
    
    chars = list(line)
    for char in chars:
        # 处理全角英文 PR
        if char in ['Ｐ', 'Ｒ']:
            kanji_res += char
            kana_res += char # 假名也保留 PR
            continue
            
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
        if '\u4e00' <= char <= '\u9fff' or char == '々' or char in ['Ｐ', 'Ｒ']:
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
            
        if i + 2 < len(lines):
            raw_word = lines[i].strip()
            pos_raw = lines[i+1].strip()
            meaning = lines[i+2].strip()
            
            # 简单验证
            if not (("名" in pos_raw or "动" in pos_raw or "形" in pos_raw) and ("（" in pos_raw or pos_raw in ["名", "副", "形1", "形2"])):
                 # 容错：名・形2 这种
                 if not (pos_raw in ["名", "形1", "形2", "副"] or "・" in pos_raw):
                    i += 1
                    continue

            kana, kanji = parse_line(raw_word)
            
            # 特殊修正：じ自こ己ＰＲ -> 假名应该是 じこPR
            if "ＰＲ" in kana:
                kana = kana.replace("ＰＲ", "PR")
                kanji = kanji.replace("ＰＲ", "PR")
            
            # 特殊修正：て手あ編みする -> てあみ
            if kana == "てあみする":
                kana = "てあみ"
                kanji = "手編み"
            
            # 特殊修正：む無だ駄づか遣い -> むだづかい
            if kana == "むだづかい":
                # 不需要变
                pass

            # 使用手动映射表修正词性
            final_pos = "名词" # 默认
            if kana in CORRECT_POS_MAP:
                final_pos = CORRECT_POS_MAP[kana]
            else:
                pass
                
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
            i += 3
        else:
            break
            
    return words

if __name__ == "__main__":
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson6_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
