import re
import json

def parse_line(line):
    # 解析假名和汉字
    # 格式：假名+汉字+假名+汉字+...
    # 例如：あらた改まる -> 假名：あらたまる，汉字：改まる
    # 规则：
    # 1. 汉字前面的所有假名是该汉字的读音。
    # 2. 汉字后面的假名直接保留。
    
    # 简单实现：
    # 遍历每个字符。
    # 如果是汉字：前面的假名缓冲作为读音，并清空缓冲。汉字加入汉字串。
    # 如果是假名：加入缓冲。
    # 结束后：如果是假名缓冲还有剩余，直接加入假名串（例如送假名）。
    
    kana_buf = ""
    kanji_str = ""
    kana_str = ""
    
    # 简单的正则判断假名和汉字
    # \u3040-\u309F 平假名
    # \u30A0-\u30FF 片假名
    # \u4E00-\u9FFF 汉字
    
    chars = list(line)
    for char in chars:
        if '\u4e00' <= char <= '\u9fff' or char == '々': # 汉字
            if kana_buf:
                kana_str += kana_buf # 前面的假名是读音
                kana_buf = ""
            kanji_str += char
        elif '\u3040' <= char <= '\u309f' or '\u30a0' <= char <= '\u30ff' or char == 'ー': # 假名
            kana_buf += char
            kanji_str += char # 汉字串也要包含送假名
            kana_str += char
        else:
            # 其他字符（如标点等），直接追加
            kana_buf += char
            kanji_str += char
            kana_str += char

    # 修正逻辑：如果假名和汉字完全相同（全是假名），汉字设为空
    # 上述逻辑对于“送假名”处理有点问题。送假名应该只出现在汉字后面，且在汉字串和假名串中都出现。
    # 让我们换一种思路：
    # 原始串：`あらた改まる`
    # 假名串：`あらたまる`
    # 汉字串：`改まる`
    
    # 正确逻辑：
    # 遇到汉字时，把前面的假名缓冲加到假名串，把汉字加到汉字串，清空假名缓冲。
    # 遇到假名时，加到假名缓冲。
    # 最后，把剩余的假名缓冲加到假名串和汉字串。
    
    kana_buf = ""
    kanji_res = ""
    kana_res = ""
    
    for char in chars:
        if '\u4e00' <= char <= '\u9fff' or char == '々': # 汉字
            if kana_buf:
                kana_res += kana_buf
                kana_buf = ""
            kanji_res += char
        else: # 非汉字（假名、符号等）
            kana_buf += char
            
    # 处理剩余的 buffer（送假名或纯假名）
    if kana_buf:
        kana_res += kana_buf
        kanji_res += kana_buf
        
    # 如果没有汉字，kanji_res 应该为空
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
    current_word = {}
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
            
        if line in ["本文", "文法"]: # 跳过标题
            i += 1
            continue
            
        # 假设是3行一组：单词，词性，中文
        # 但有时候可能有空行或者不规则，这里简单假设紧凑排列
        if i + 2 < len(lines):
            raw_word = lines[i].strip()
            pos = lines[i+1].strip()
            meaning = lines[i+2].strip()
            
            # 简单的验证：词性行通常包含 "名"、"动"、"形" 等
            if not (("名" in pos or "动" in pos or "形" in pos or "副" in pos) and "（" in pos):
                # 可能不是词性行，跳过当前行
                i += 1
                continue

            kana, kanji = parse_line(raw_word)
            
            words.append({
                "data": {
                    "假名": kana,
                    "汉字": kanji,
                    "中文": meaning,
                    "例句": "", # 待填充
                    "词性": pos,
                    "日语干扰词": [], # 待填充
                    "中文干扰词": []  # 待填充
                }
            })
            i += 3
        else:
            break
            
    return words

if __name__ == "__main__":
    words = process_file("/Users/bytedance/Documents/trae_code/MeowBread/MeowBread_database/dictionary_maker/temp_TRY_N2_lesson2_content.txt")
    print(json.dumps(words, ensure_ascii=False, indent=2))
