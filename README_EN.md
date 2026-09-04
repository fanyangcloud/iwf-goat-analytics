# IWF Historical Weightlifting GOAT Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-emerald.svg)](#)

A cross-era quantitative valuation engine and interactive cockpit dedicated to evaluating the greatest weightlifters across all eras of the International Weightlifting Federation (IWF)—from the 1950s "Three-Lifts Golden Era" through the Paris 2024 Olympic Games.

The platform catalogs 42 Hall of Fame legends and introduces a logarithmic marginal diminishing returns model to mitigate the statistical distortion caused by Cold War "0.5kg/1kg record-shaving," establishing an objective and scientifically rigorous GOAT evaluation benchmark.

---

## Architecture & Modular Decoupling

Engineered around the principles of decoupled data persistence, pure functional computation, separated web assets, and single-entry execution—with zero external runtime dependencies:

```text
iwf-goat-analytics/
├── data/
│   └── athletes.json         # [Core Data Source] 42 titans with structured historical metrics
├── engine/
│   ├── config.py             # [Single Source of Truth] Base weights, decay ratios & constants
│   └── calculator.py         # [Valuation Engine] Pure mathematical engine with WR logarithmic decay
├── web/
│   ├── server.py             # [Service Layer] Standard library HTTP router & API dispatcher
│   └── static/               # [Cockpit UI] Modern dark cyberpunk terminal assets
│       ├── index.html        # Semantic HTML5 DOM skeleton
│       ├── style.css         # Financial/Bloomberg terminal style system
│       └── app.js            # Reactive state management, debounced requests & CSV export
└── run.py                    # [Bootstrapper] Port discovery, service assembly & auto-launch
```

---

## Sports Metrology & Mathematical Framework

### 1. IWF Total (Big Medal) Standard
Evaluations strictly track **Total (Big) Medals**, filtering out single-lift (Snatch / Clean & Jerk) inflation:
* **Olympic Games (OG)**: Gold = 100.0 pts, Silver = 40.0 pts (40%), Bronze = 20.0 pts (20%)
* **World Championships (WC)**: Gold = 35.0 pts, Silver = 14.0 pts, Bronze = 7.0 pts
* **Continental Championships (CC)**: Gold = 12.0 pts, Silver = 4.8 pts, Bronze = 2.4 pts
* **Continental Games (CG)**: Gold = 10.0 pts, Silver = 4.0 pts, Bronze = 2.0 pts

### 2. World Record (WR) Logarithmic Diminishing Returns
During the Cold War, Soviet state bonuses from Goskomsport encouraged lifters to break records by the minimum possible increment (0.5kg to 1kg) across low-tier invitationals. Conversely, modern athletes face strict anti-doping regulations and three complete bodyweight category resets (1993, 1998, 2018) that erased record progression lines.

To counter linear record inflation ($WR \times 4.5$), this system implements a logarithmic marginal diminishing returns function:

$$S_{\text{WR}}(N) = W_{\text{wr\_point}} \cdot S \cdot \ln(1 + k \cdot N)$$

* $N$: Total world records broken (`wr_count`)
* $W_{\text{wr\_point}}$: Base slider weight parameter (default: $4.5$)
* $S = 8.0$: Scale factor ensuring initial record gains align with base scoring
* $k = 0.12$: Curvature decay parameter dampening the marginal utility of excessive record accumulation

**Normalization Impact**:
* **Naim Süleymanoğlu** (46 WRs): Adjusted from a linear 207.0 pts to **67.5 pts**
* **Vasily Alekseyev** (80 WRs): Adjusted from a linear 360.0 pts to **85.0 pts**
* **Outcome**: Süleymanoğlu (3x Olympic Gold, 7x World Total Gold, 505+ peak Sinclair) rightfully regains the consensus **GOAT #1** standing.

---

## Quickstart Guide

This project maintains a strict **Zero External Dependencies** philosophy, requiring only Python 3.8+:

```bash
# 1. Clone the repository and enter the directory
git clone https://github.com/your-username/iwf-goat-analytics.git
cd iwf-goat-analytics

# 2. Run the bootstrapper (auto-probes available ports and launches browser)
python3 run.py
```

The service initializes at `http://127.0.0.1:8899` (or next free port) and displays the analytics dashboard immediately.

---

## Dataset Schema (`data/athletes.json`)

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
  "peak_note": "Clean & Jerk 190.0kg (3.17x BW) / Snatch 152.5kg / All-time highest Sinclair (505+)",
  "peak_coefficient": 119.5,
  "summary": "'The Pocket Hercules', universally acclaimed technical and relative strength pinnacle in weightlifting history."
}
```

---

## Contributing Guidelines

1. **Target File**: All athlete updates, corrections, and additions must be submitted as Pull Requests against `data/athletes.json`.
2. **Data Verification Rules**:
   * Data must match verified official IWF and IOC records;
   * Between 1964 and 1984, Olympic Games weightlifting tournaments doubled as the World Championships. Do **not** double-count these medals in both `og` and `wc`;
   * Single-lift medals (Snatch / Clean & Jerk) must not be counted as World Championship medals.

---

## License

This project is licensed under the [MIT License](LICENSE).