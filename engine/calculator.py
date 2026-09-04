#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
IWF GOAT ANALYTICS SYSTEM - QUANTITATIVE VALUATION ENGINE
架构职责：无状态纯函数计算矩阵，实现对数边际递减WR算法与全量GOAT排位
================================================================================
"""

import json
import math
import os
from typing import Dict, List, Any, Optional

from engine.config import (
    DEFAULT_WEIGHTS,
    DATA_FILE_PATH,
    WR_DECAY_SCALE,
    WR_DECAY_FACTOR
)


def load_athletes(file_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """加载并解析运动员核心历史数据集"""
    target_path = file_path or DATA_FILE_PATH
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"[Engine Error] 数据文件不存在: {target_path}")
    
    with open(target_path, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_wr_score(wr_count: int, wr_weight: float) -> float:
    """
    计算打破世界纪录的积分贡献（严格采用对数边际收益递减模型）
    公式: Score = wr_weight * SCALE * ln(1 + FACTOR * wr_count)
    """
    if wr_count <= 0:
        return 0.0
    
    diminishing_score = wr_weight * WR_DECAY_SCALE * math.log(1.0 + WR_DECAY_FACTOR * wr_count)
    return round(diminishing_score, 2)


def calculate_goat_rankings(
    athletes_data: Optional[List[Dict[str, Any]]] = None,
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    计算全量选手的多维加权总分并按降序赋予排名
    除了 WR 采用非线性边际递减外，其余奖牌与巅峰表现力维持原始线性模型
    """
    if athletes_data is None:
        athletes_data = load_athletes()

    # 合并传入的动态权重（若缺省则使用系统基准真理源）
    w = dict(DEFAULT_WEIGHTS)
    if weights:
        w.update(weights)

    results = []
    for ath in athletes_data:
        # 1. 奥运会奖牌分
        s_og = (
            ath["og"]["gold"] * w["og_gold"] +
            ath["og"]["silver"] * w["og_silver"] +
            ath["og"]["bronze"] * w["og_bronze"]
        )

        # 2. 世锦赛总成绩奖牌分
        s_wc = (
            ath["wc"]["gold"] * w["wc_gold"] +
            ath["wc"]["silver"] * w["wc_silver"] +
            ath["wc"]["bronze"] * w["wc_bronze"]
        )

        # 3. 洲际锦标赛奖牌分
        s_cc = (
            ath["cc"]["gold"] * w["cc_gold"] +
            ath["cc"]["silver"] * w["cc_silver"] +
            ath["cc"]["bronze"] * w["cc_bronze"]
        )

        # 4. 洲际综合运动会奖牌分
        s_cg = (
            ath["cg"]["gold"] * w["cg_gold"] +
            ath["cg"]["silver"] * w["cg_silver"] +
            ath["cg"]["bronze"] * w["cg_bronze"]
        )

        # 5. 打破世界纪录分（核心升级：对数边际递减）
        s_wr = calculate_wr_score(ath["wr_count"], w["wr_point"])

        # 6. 时代巅峰表现修正分
        s_peak = ath["peak_coefficient"] * w["peak_scale"]

        # 加总并保留2位小数
        total_score = round(s_og + s_wc + s_cc + s_cg + s_wr + s_peak, 2)

        results.append({
            **ath,
            "score_breakdown": {
                "olympics": round(s_og, 1),
                "worlds": round(s_wc, 1),
                "continental_champ": round(s_cc, 1),
                "continental_games": round(s_cg, 1),
                "world_records": round(s_wr, 1),
                "peak": round(s_peak, 1)
            },
            "total_score": total_score
        })

    # 按总分降序排列
    results.sort(key=lambda x: x["total_score"], reverse=True)

    # 赋予排位
    for rank, item in enumerate(results, start=1):
        item["rank"] = rank

    return results
