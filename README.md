# IWF 举重全历史 GOAT 量化分析平台 (IWF GOAT Analytics System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-emerald.svg)](#)

面向国际举重联合会（IWF）全历史周期的跨时代量化排位与交互式数据驾驶舱。系统收录了自 1950 年代“推、抓、挺三项时代”至 2024 年巴黎奥运会以来的 42 位殿堂级举重巨星，通过对数边际递减模型平抑冷战时期“单公斤刷纪录”带来的数据通胀，建立严谨客观的 GOAT 评价体系。

---

## 核心架构与模块解耦

工程遵循“数据持久化独立、计算纯函数化、前端资源分层、单入口驱动”的设计原则，全流程零外部依赖：

```text
iwf-goat-analytics/
├── data/
│   └── athletes.json         # 【核心数据源】42 位巨星全量历史指标（独立结构化存储）
├── engine/
│   ├── config.py             # 【单一真理源】基准权重配置、奖牌衰减比与数学模型常量
│   └── calculator.py         # 【量化引擎】纯函数计算矩阵，含 WR 对数边际递减模型
├── web/
│   ├── server.py             # 【服务层】基于标准库的高性能静态资源与 API 分发
│   └── static/               # 【前端驾驶舱】专业深色终端 UI
│       ├── index.html        # 语义化 DOM 骨架
│       ├── style.css         # 彭博终端科技风格样式体系
│       └── app.js            # 响应式状态管理、防抖动态请求与 CSV 导出
└── run.py                    # 【启动入口】可用端口自适应探测、服务装配与自启
```

---

## 体育统计学与量化模型

### 1. 赛事总成绩大金牌基准
系统严格遵循 **IWF 总成绩大金牌基准**，剔除抓举与挺举单项小奖牌：
* **奥运会 (Olympic Games)**：金牌 100 分，银牌 40 分（40%），铜牌 20 分（20%）
* **世锦赛 (World Championships)**：总成绩金牌 35 分，银牌 14 分，铜牌 7 分
* **洲际锦标赛 (Continental Champs)**：金牌 12 分，银牌 4.8 分，铜牌 2.4 分
* **洲际运动会 (Continental Games)**：金牌 10 分，银牌 4 分，铜牌 2 分

### 2. 世界纪录（WR）对数边际收益递减模型
针对冷战时期苏联等国体委奖励机制带来的“单公斤/半公斤刷单”现象，系统放弃线性累乘，引入对数边际递减函数：

$$S_{\text{WR}}(N) = W_{\text{wr\_point}} \cdot S \cdot \ln(1 + k \cdot N)$$

* $N$：打破世界纪录总次数（`wr_count`）
* $W_{\text{wr\_point}}$：滑动条动态基准权重（默认 $4.5$）
* $S = 8.0$：尺度缩放因子，确保首次破纪录收益贴合基准
* $k = 0.12$：曲率衰减系数，平滑收敛高频次刷单收益

**平抑对比**：
* 纳伊姆·苏莱曼诺尔古（46 次 WR）：得分由线性 207 分平抑至 **67.5 分**
* 瓦西里·阿列克谢耶夫（80 次 WR）：得分由线性 360 分平抑至 **85.0 分**
* 矫正效果：苏莱曼诺尔古凭借 3 届奥运金牌、7 届世锦赛大金牌与 505+ 辛克莱峰值重回 **GOAT #1**。

---

## 快速启动

本项目采用**零外部第三方依赖（Zero External Dependencies）**架构，仅需 Python 3.8+ 标准运行环境：

```bash
# 1. 克隆并进入工程目录
git clone https://github.com/your-username/iwf-goat-analytics.git
cd iwf-goat-analytics

# 2. 运行工程启动器（自动绑定可用端口并调起浏览器）
python3 run.py
```

服务默认在 `http://127.0.0.1:8899` 启动并自动弹出数据看板。

---

## 数据集结构说明 (`data/athletes.json`)

```json
{
  "id": "naim-suleymanoglu",
  "name": "Naim Süleymanoğlu",
  "name_zh": "纳伊姆·苏莱曼诺尔古",
  "gender": "M",
  "nation": "TUR / BUL",
  "era_category": "1980-1999",
  "weight_group": "LIGHT",
  "active_years": "1983-2000",
  "best_class": "60kg / 64kg",
  "og": { "gold": 3, "silver": 0, "bronze": 0 },
  "wc": { "gold": 7, "silver": 1, "bronze": 0 },
  "cc": { "gold": 7, "silver": 0, "bronze": 0 },
  "cg": { "gold": 0, "silver": 0, "bronze": 0 },
  "wr_count": 46,
  "peak_note": "挺举190.0kg (3.17倍体重) / 抓举152.5kg / 辛克莱系数历史最高 (505+)",
  "peak_coefficient": 119.5,
  "summary": "“口袋大力士”，举重史公认技术与相对体重力量极限，完成人类极限的三倍体重挺举。"
}
```

---

## 开源贡献规范

1. **元数据提交**：所有数据修正与新增巨星均须对 `data/athletes.json` 提交 PR。
2. **赛事口径校验**：
   * 严格以 IWF 与 IOC 最终认定记录为准；
   * 严禁将 1964–1984 年间“兼作世锦赛”的奥运会成绩进行双重计分（Double-Counting）；
   * 单项抓举或挺举奖牌不得计入世锦赛总成绩。

---

## 开源协议

本项目基于 [MIT License](LICENSE) 协议发布。