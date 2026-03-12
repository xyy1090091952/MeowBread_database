import json
import re

# 映射规则 (复用之前逻辑)
POS_MAPPING = {
    "名": "名词",
    "形1": "一类形容词",
    "形2": "二类形容词",
    "副": "副词",
}

def normalize_pos(pos):
    # 清理词性中的空格
    pos = pos.replace(" ", "")
    
    # 映射处理
    if pos in POS_MAPPING:
        return POS_MAPPING[pos]
    
    # 处理复杂的动词
    # 提取括号内的自他性
    match = re.search(r'（(.*?)）', pos)
    if match:
        transitivity = match.group(1)
        # 将 "自・他" 转换为 "自动词、他动词"
        # 将 "自他" 转换为 "自动词、他动词" (有些写法可能是自他)
        trans_parts = transitivity.replace('・', '、').replace('自他', '自动词、他动词').split('、')
        
        normalized_trans = []
        for part in trans_parts:
            if part == '自':
                normalized_trans.append('自动词')
            elif part == '他':
                normalized_trans.append('他动词')
            elif part == '自动词' or part == '他动词':
                normalized_trans.append(part)
        
        trans_str = "、".join(normalized_trans)
        
        # 判断主体是动词还是名词+动词
        if '名' in pos and '动' in pos:
            return f"名词、{trans_str}"
        elif pos.startswith('动'):
            return trans_str
            
    return pos

def parse_line(line):
    # 解析假名和汉字
    # 格式：假名+汉字+假名+汉字+...
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
        else: # 非汉字（假名、符号等）
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
            
        # 尝试匹配三行结构：单词 -> 词性 -> 中文
        # 但有些单词可能因为 textutil 转换问题被截断，例如 "かく拡だい大" 这种是正常的
        # 但像 "た" (形2) "新的" -> 这看起来像 "あらた" 被截断了？
        # 或者 "れる" (动2) -> "はなれる" ?
        # 让我们先按标准解析，之后人工检查或通过规则修复明显错误
        
        if i + 2 < len(lines):
            raw_word = lines[i].strip()
            pos = lines[i+1].strip()
            meaning = lines[i+2].strip()
            
            # 简单的验证：词性行通常包含 "名"、"动"、"形" 等
            if not (("名" in pos or "动" in pos or "形" in pos or "副" in pos) and ("（" in pos or pos in ["名", "副", "形1", "形2"])):
                # 可能不是词性行，尝试跳过当前行
                i += 1
                continue

            kana, kanji = parse_line(raw_word)
            
            # 修复部分被 textutil 转换错误的单词
            # 观察到：
            # か加する -> さんかする/参加する (缺少さん)
            # きん勤する -> てんきんする/転勤する (缺少てん)
            # た -> あらた/新たな (缺少あら、な) -> 原文可能是 "あらたな"
            # せん戦する -> ちょうせんする/挑戦する (缺少ちょう)
            # れる -> はなれる/離れる (缺少はな)
            # づか遣い -> きづかい/気遣い (缺少き)
            # しゃ謝する -> かんしゃする/感謝する (缺少かん)
            # りゅう流する -> こうりゅうする/交流する (缺少こう)
            # ざ指す -> めざす/目指す (缺少め)
            
            # 看起来 textutil 转换时，如果首字是汉字且前面有假名，可能会丢失前面的假名？
            # 或者 docx 本身排版是“注音在上方”，转换成 txt 后错位了。
            # 我们需要手动修正这些已知错误，或者根据上下文猜测。
            # 由于这是第2课（2）的单词，我可以尝试根据 N2 词汇表进行修正，或者先生成 JSON，然后让用户确认/我再修正。
            # 为了提供高质量结果，我将内置一个修正映射表。
            
            CORRECTIONS = {
                "か加する": ("さんかする", "参加する"),
                "きん勤する": ("てんきんする", "転勤する"),
                "た": ("あらたな", "新たな"),
                "せん戦する": ("ちょうせんする", "挑戦する"),
                "れる": ("はなれる", "離れる"),
                "づか遣い": ("きづかい", "気遣い"),
                "しゃ謝する": ("かんしゃする", "感謝する"),
                "りゅう流する": ("こうりゅうする", "交流する"),
                "さい際する": ("こうさいする", "交際する"),
                "しょ書する": ("とうしょする", "投書する"),
                "ざ指す": ("めざす", "目指す"),
                "ちょ貯きん金": ("ちょきんする", "貯金する"), # 修正动词化
                "けん健こう康しん診だん断": ("けんこうしんだん", "健康診断"),
                "ない内てい定": ("ないていする", "内定する"), # 修正动词化
                "せん宣でん伝する": ("せんでんする", "宣伝する"),
                "おう応えん援する": ("おうえんする", "応援する"),
                "こう交たい替する": ("こうたいする", "交代する"),
                "たい対こう抗する": ("たいこうする", "対抗する"),
                "きょう競ぎ技する": ("きょうぎする", "競技する"),
                "けっ結せい成": ("けっせいする", "結成する"), # 修正动词化
                "こう貢けん献": ("こうけんする", "貢献する"), # 修正动词化
                "ととの整える": ("ととのえる", "整える"),
                "なつ懐かしい": ("なつかしい", "懐かしい"),
                "こ込む・こ混む": ("こむ", "込む・混む"),
                "あらそ争う": ("あらそう", "争う"),
                "かく覚ご悟": ("かくごする", "覚悟する"), # 修正动词化
                "さい裁ばん判": ("さいばんする", "裁判する"), # 修正动词化
                "せい生さん産する": ("せいさんする", "生産する"),
                "つう通がく学する": ("つうがくする", "通学する"),
                "けい警び備": ("けいびする", "警備する"), # 修正动词化
                "む夢ちゅう中": ("むちゅう", "夢中"),
                "ひ日ごろ頃": ("ひごろ", "日頃"),
                "せい精いっ一ぱい杯": ("せいいっぱい", "精一杯"),
            }
            
            if raw_word in CORRECTIONS:
                kana, kanji = CORRECTIONS[raw_word]
            
            words.append({
                "data": {
                    "假名": kana,
                    "汉字": kanji,
                    "中文": meaning,
                    "例句": "", # 待填充
                    "词性": normalize_pos(pos),
                    "日语干扰词": [], # 待填充
                    "中文干扰词": []  # 待填充
                }
            })
            i += 3
        else:
            break
            
    return words

if __name__ == "__main__":
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson3_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
