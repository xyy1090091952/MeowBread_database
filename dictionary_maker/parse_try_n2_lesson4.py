import json
import re

# 手动验证的词性映射表 (lesson4)
# 基于 N2 常见用法和 "只保留最符合的一个" 原则
CORRECT_POS_MAP = {
    "こころがまえ": "名词", # 心構え
    "くじょう": "名词", # 苦情
    "しょりする": "他动词", # 処理する
    "であう": "自动词", # 出会う
    "あやまる": "他动词", # 謝る (～を)
    "せいとう": "形容动词", # 正当 (正当な)
    "ふかい": "形容动词", # 不快 (不快な)
    "しんらい": "他动词", # 信頼する (虽然原文是名·动3，但作为动词时他动)
    "うしなう": "他动词", # 失う
    "たいざいする": "自动词", # 滞在する
    "しつ": "名词", # 質
    "ぎょうかい": "名词", # 業界
    "ついきゅう": "他动词", # 追求する
    "あわせる": "他动词", # 合わせる
    "だいりする": "自动词", # 代理する (做代理)
    "ていど": "名词", # 程度
    "こうれいしゃ": "名词", # 高齢者
    "しんせいする": "他动词", # 申請する (～を)
    "じっこうする": "他动词", # 実行する
    "うつす": "他动词", # 移す
    "どうりょう": "名词", # 同僚
    "せっきん": "自动词", # 接近する
    "やがい": "名词", # 野外
    "したがう": "自动词", # 従う
    "たよる": "自动词", # 頼る (～に)
    "じょうたい": "名词", # 状態
    "かんじょう": "名词", # 感情
    "むし": "他动词", # 無視する (～を)
    "いためる": "他动词", # 痛める
    "ひがい": "名词", # 被害
    "かいてき": "形容动词", # 快適 (快適な)
    "しゅうしょくなん": "名词", # 就職難
    "みりょく": "名词", # 魅力
    "あぶらえ": "名词", # 油絵
    "げんかい": "名词", # 限界
    "みため": "名词", # 見た目
    "たたかう": "自动词", # 戦う (～と)
    "まんぞく": "自动词", # 満足する (～に) - 原文 名・形2・动3。
    # 满足既可以是 名词，也可以是 形容动词 (満足な)，也可以是 动词 (満足する)。
    # 作为 N2 单词，通常考点在于 "満足する"。或者 "満足感"。
    # 让我们选 "自动词" 或 "形容动词"。
    # "満足な生活" vs "現状に満足する"。
    # 选 "自动词" 比较稳妥，因为动3形式常见。
    "しゅつえんしゃ": "名词", # 出演者
    "とくしゅう": "名词", # 特集
    "きょうみぶかい": "形容词", # 興味深い
    "はいりょする": "自动词", # 配慮する (～に)
    "とうさんする": "自动词", # 倒産する
    "ねぶそく": "名词", # 寝不足
    "こっせつする": "自动词", # 骨折する (脚を骨折する -> 这里的骨折する通常指 "骨折了" 的状态变化，或者 "脚が骨折する"？)
    # 不，通常说 "足を骨折した"。此时 骨折する 是他动词用法？不，骨折是名词，骨折する是サ变。
    # "骨折する" 通常指 "发生骨折"。
    # 字典里 骨折 是 名・自サ。所以是 "自动词"。
    "あくようする": "他动词", # 悪用する
    "はげしい": "形容词", # 激しい
    "さぎ": "名词", # 詐欺
    "あっかする": "自动词", # 悪化する
    "おとずれる": "自动词", # 訪れる (～に/が)
    "あまえる": "自动词", # 甘える
    "がくひ": "名词", # 学費
    "じじょう": "名词", # 事情
    "ひとくち": "名词", # 一口
    "ねっしん": "形容动词", # 熱心 (熱心な)
    "ふんいき": "名词", # 雰囲気
    "きたくする": "自动词", # 帰宅する
    "よくあさ": "名词", # 翌朝
    "リズム": "名词",
    "かいしょうする": "他动词", # 解消する (～を)
    "じかんたい": "名词", # 時間帯
    "かみん": "名词", # 仮眠
    "のうにゅうする": "他动词", # 納入する
    "とりひき": "名词", # 取引 (虽然原文有动3，但通常做名词用)
    "かんけいしょるい": "名词", # 関係書類
    "せんぽう": "名词", # 先方
}

def parse_line(line):
    kana_buf = ""
    kanji_res = ""
    kana_res = ""
    
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
            
        if i + 2 < len(lines):
            raw_word = lines[i].strip()
            pos_raw = lines[i+1].strip()
            meaning = lines[i+2].strip()
            
            # 简单验证
            if not (("名" in pos_raw or "动" in pos_raw or "形" in pos_raw) and ("（" in pos_raw or pos_raw in ["名", "副", "形1", "形2"])):
                 # 尝试容错：有时候可能是 "名・形2" 这种没括号的
                 if not (pos_raw in ["名", "形1", "形2", "副"] or "・" in pos_raw):
                    i += 1
                    continue

            kana, kanji = parse_line(raw_word)
            
            # 使用手动映射表修正词性
            final_pos = "名词" # 默认
            if kana in CORRECT_POS_MAP:
                final_pos = CORRECT_POS_MAP[kana]
            else:
                # 如果不在表中，尝试自动解析
                # 但 lesson4 的词都在表中了，这里作为 fallback
                pass
                
            words.append({
                "data": {
                    "假名": kana,
                    "汉字": kanji,
                    "中文": meaning,
                    "例句": "", # 待填充
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
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson4_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
