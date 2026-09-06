#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import re

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "athletes.json")

# IWF 官方规范术语替换字典
IWF_TERMS = [
    ("挺举", "C&J "),
    ("抓举", "Snatch "),
    ("总成绩", "Total "),
    ("倍体重挺举", "x BW C&J"),
    ("倍体重", "x BW"),
    ("辛克莱系数历史最高", "All-time highest Sinclair"),
    ("辛克莱系数", "Sinclair"),
    ("三项时代", "Triathlon era"),
    ("历史打破世界纪录总次数第一", "All-time #1 in total WRs"),
    ("人类绝对力量物理极限总成绩第一人", "All-time highest physical Total in human history"),
    ("次打破世界纪录", " WRs broken"),
    ("次刷新世界纪录", " WRs broken"),
    ("次改写世界纪录", " WRs broken"),
    ("改写世界纪录", "broke WR"),
    ("破世界纪录", "broke WR"),
    ("欧锦赛恐怖9连冠", "9x consecutive European titles"),
    ("欧锦赛", "European Champ"),
    ("世锦赛", "World Champ"),
    ("奥运会", "Olympic Games"),
    ("奥运", "Olympics"),
    ("改写WR", "broke WR"),
    ("破WR", "broke WR"),
    ("创WR夺冠", "set WR to win Gold"),
    ("创WR", "set WR"),
    ("夺金", "Gold"),
    ("夺冠", "Gold"),
    ("世界纪录", "World Record"),
    ("标志性“金鸡独立”", "Iconic 'Flamingo' single-leg jerk"),
    ("包揽三金", "swept all 3 Golds"),
    ("创奥运纪录", "Olympic Record"),
    ("跨级别", "across weight classes"),
    ("两连冠", "back-to-back Champion"),
    ("三连冠", "3-time Champion")
]

def clean_peak_note_en(text):
    if not text:
        return ""
    res = text
    for zh, en in IWF_TERMS:
        res = res.replace(zh, en)
    # 去除中文字符残余
    res = re.sub(r'[\u4e00-\u9fa5]+', '', res)
    # 格式化标点
    res = re.sub(r'\s+', ' ', res).strip()
    return res

def generate_summary_en(ath):
    og_g = ath.get("og", {}).get("gold", 0)
    wc_g = ath.get("wc", {}).get("gold", 0)
    wr = ath.get("wr_count", 0)
    name = ath.get("name", "Legend")
    nation = ath.get("nation", "")
    cls = ath.get("best_class", "")
    
    titles = []
    if og_g > 0: titles.append(f"{og_g}x Olympic Gold Medalist")
    if wc_g > 0: titles.append(f"{wc_g}x World Champion")
    title_str = ", ".join(titles) if titles else "Hall of Fame Weightlifter"
    
    return f"{name} ({nation}), competing in {cls}. {title_str} with {wr} official World Records broken. Widely celebrated as an all-time pillar of the sport."

def main():
    if not os.path.exists(DATA_PATH):
        print(f"[Error] 未找到数据文件: {DATA_PATH}")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        athletes = json.load(f)

    # 知名巨星特订英文精修描述 (定制典范)
    CURATED_SUMMARIES = {
        "naim-suleymanoglu": "Known as 'The Pocket Hercules', widely acknowledged as the absolute pinnacle of relative strength and technique in weightlifting history, clean & jerking over 3x his bodyweight.",
        "vasily-alekseyev": "The legendary Soviet super-heavyweight titan who set an all-time record of 80 World Records and dominated 8 consecutive World Championship titles.",
        "david-rigert": "A virtuoso of the Cold War era with 68 World Records to his name and an unmatched 9 European Championship total titles.",
        "lasha-talakhadze": "The ultimate modern super-heavyweight titan and 3-time Olympic Champion, holding the highest physical snatch (225kg), clean & jerk (267kg), and total (492kg) in human history.",
        "halil-mutlu": "Triple Olympic Champion and 5-time World Champion, dominating the lighter categories and clean & jerking triple his bodyweight with supreme consistency.",
        "lu-xiaojun": "The textbook master of the squat jerk and snatch. 3-time Olympic Champion who commanded the middleweight division across more than a decade.",
        "pyrros-dimas": "Greek weightlifting icon and lionhearted competitor, standing on four consecutive Olympic podiums with three consecutive Gold medals.",
        "li-wenwen": "Undisputed powerhouse of modern women's super-heavyweight lifting, holding all-time records across snatch, C&J, and total with massive dominance."
    }

    count = 0
    for ath in athletes:
        aid = ath.get("id")
        # 1. 自动生成符合国际标准的简练英文 Peak Note
        ath["peak_note_en"] = clean_peak_note_en(ath.get("peak_note", ""))
        
        # 2. 生成英文生平
        if aid in CURATED_SUMMARIES:
            ath["summary_en"] = CURATED_SUMMARIES[aid]
        else:
            ath["summary_en"] = generate_summary_en(ath)
        count += 1

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(athletes, f, ensure_ascii=False, indent=2)

    print(f"✅ 成功完成 {count} 位运动员的国际化数据扩充！")
    print(f"数据已安全写入: {DATA_PATH}")

if __name__ == "__main__":
    main()
