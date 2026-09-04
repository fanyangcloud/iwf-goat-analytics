#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
IWF GOAT ANALYTICS SYSTEM - ENGINE CONFIGURATION
架构职责：定义系统量化真理源（默认权重、奖牌衰减比例、WR边际递减数学参数）
================================================================================
"""

import os
from pathlib import Path

# 项目根路径与数据源路径
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE_PATH = os.path.join(BASE_DIR, "data", "athletes.json")

# 奖牌级别衰减比例（基于对应赛事金牌基准）
# 银牌价值 = 金牌 * 0.40；铜牌价值 = 金牌 * 0.20
MEDAL_RATIOS = {
    "silver": 0.40,
    "bronze": 0.20
}

# 默认基础评估权重字典 (Default Base Weights)
DEFAULT_WEIGHTS = {
    "og_gold": 100.0,
    "og_silver": 40.0,
    "og_bronze": 20.0,
    "wc_gold": 35.0,
    "wc_silver": 14.0,  # 35 * 0.40
    "wc_bronze": 7.0,   # 35 * 0.20
    "cc_gold": 12.0,
    "cc_silver": 4.8,   # 12 * 0.40
    "cc_bronze": 2.4,   # 12 * 0.20
    "cg_gold": 10.0,
    "cg_silver": 4.0,   # 10 * 0.40
    "cg_bronze": 2.0,   # 10 * 0.20
    "wr_point": 4.5,    # WR 边际基准乘数
    "peak_scale": 1.0   # 时代巅峰表现修正系数
}

# ==============================================================================
# 世界纪录（WR）边际递减模型参数 (Marginal Diminishing Returns for WR)
# 数学公式: S_wr = wr_point * WR_DECAY_SCALE * ln(1 + WR_DECAY_FACTOR * count)
# 物理意义:
# - WR_DECAY_SCALE (8.0): 确保首个 WR 的得分接近原始的 1.0x 权重
# - WR_DECAY_FACTOR (0.12): 随着打破次数递增平滑收敛，平抑冷战小步快跑刷单
# ==============================================================================
WR_DECAY_SCALE = 8.0
WR_DECAY_FACTOR = 0.12
