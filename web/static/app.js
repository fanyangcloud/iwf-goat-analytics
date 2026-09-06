/**
 * web/static/app.js
 * 核心逻辑：数据完全由后端 JSON 驱动，多维过滤防崩溃，动态统计指标
 */

let rawDataset = [];       // 服务端返回的基准全量排行榜
let currentDataset = [];   // 经过条件过滤后的当前展示集

// 筛选状态字典（默认全部）
const filterState = {
    gender: 'ALL',
    weightGroup: 'ALL',
    era: 'ALL',
    keyword: ''
};

// 权重滑块映射表
const weightSliders = [
    { id: 'w_og_gold', key: 'og_gold', lbl: 'lbl_og_gold' },
    { id: 'w_wc_gold', key: 'wc_gold', lbl: 'lbl_wc_gold' },
    { id: 'w_cc_gold', key: 'cc_gold', lbl: 'lbl_cc_gold' },
    { id: 'w_cg_gold', key: 'cg_gold', lbl: 'lbl_cg_gold' },
    { id: 'w_wr_point', key: 'wr_point', lbl: 'lbl_wr_point' },
    { id: 'w_peak_scale', key: 'peak_scale', lbl: 'lbl_peak_scale' }
];

// 初始化监听器
weightSliders.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
        el.addEventListener('input', (e) => {
            const lbl = document.getElementById(item.lbl);
            if (lbl) lbl.innerText = e.target.value;
            debounceCalculate();
        });
    }
});

let timer = null;
function debounceCalculate() {
    clearTimeout(timer);
    timer = setTimeout(recalculateServer, 100);
}

function getActiveWeights() {
    const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) : fallback;
    };

    const og_g = getVal('w_og_gold', 100.0);
    const wc_g = getVal('w_wc_gold', 35.0);
    const cc_g = getVal('w_cc_gold', 12.0);
    const cg_g = getVal('w_cg_gold', 10.0);
    
    return {
        og_gold: og_g,
        og_silver: og_g * 0.40,
        og_bronze: og_g * 0.20,
        wc_gold: wc_g,
        wc_silver: wc_g * 0.428,
        wc_bronze: wc_g * 0.228,
        cc_gold: cc_g,
        cc_silver: cc_g * 0.416,
        cc_bronze: cc_g * 0.166,
        cg_gold: cg_g,
        cg_silver: cg_g * 0.40,
        cg_bronze: cg_g * 0.20,
        wr_point: getVal('w_wr_point', 4.5),
        peak_scale: getVal('w_peak_scale', 1.0)
    };
}

async function recalculateServer() {
    const weights = getActiveWeights();
    try {
        const res = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(weights)
        });
        
        if (!res.ok) throw new Error(`HTTP 状态异常: ${res.status}`);
        rawDataset = await res.json();
        
        // 1. 动态统计运动员总数
        const athleteCountEl = document.getElementById('kpi-athlete-count');
        if (athleteCountEl) {
            athleteCountEl.innerText = `${rawDataset.length} 人`;
        }

        // 2. 动态累加打破世界纪录总次数
        const totalWR = rawDataset.reduce((sum, item) => sum + (Number(item.wr_count) || 0), 0);
        const totalWREl = document.getElementById('kpi-total-wr');
        if (totalWREl) {
            totalWREl.innerText = `${totalWR} 次`;
        }

        // 3. 执行多维过滤流水线并渲染
        applyFilters();

    } catch (err) {
        console.error("[Engine Client Error] 动态计算失败:", err);
    }
}

/**
 * 架构防御型多维过滤管道：
 * 即使 HTML 缺少对应的 input/select，均有 safe fallback，杜绝 TypeError
 */
function applyFilters() {
    // 安全提取各控件值，若元素不存在则自动回退为默认值
    const weightEl = document.getElementById('filter-weight');
    const eraEl = document.getElementById('filter-era');
    const searchEl = document.getElementById('filter-search');

    filterState.weightGroup = weightEl ? weightEl.value : 'ALL';
    filterState.era = eraEl ? eraEl.value : 'ALL';
    filterState.keyword = searchEl ? searchEl.value.trim().toLowerCase() : '';

    currentDataset = rawDataset.filter(item => {
        // 性别过滤
        if (filterState.gender !== 'ALL' && item.gender !== filterState.gender) {
            return false;
        }
        // 体重级别分组过滤
        if (filterState.weightGroup !== 'ALL' && item.weight_group !== filterState.weightGroup) {
            return false;
        }
        // 时代纪元过滤
        if (filterState.era !== 'ALL' && item.era_category !== filterState.era) {
            return false;
        }
        // 关键词检索 (中英文姓名/国籍)
        if (filterState.keyword) {
            const matchNameZh = (item.name_zh || '').toLowerCase().includes(filterState.keyword);
            const matchNameEn = (item.name || '').toLowerCase().includes(filterState.keyword);
            const matchNation = (item.nation || '').toLowerCase().includes(filterState.keyword);
            if (!matchNameZh && !matchNameEn && !matchNation) return false;
        }
        return true;
    });

    renderTable();
}

// 规范的性别筛选器（不依赖不可靠的全局 window.event）
function setGenderFilter(gender, btnElement) {
    filterState.gender = gender;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }
    applyFilters();
}

function renderTable() {
    const tbody = document.getElementById('ranking-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 更新当前筛选集下的榜首 KPI
    const topScoreEl = document.getElementById('kpi-top-score');
    const topNameEl = document.getElementById('kpi-top-name');
    if (currentDataset.length > 0) {
        const top = currentDataset[0];
        if (topScoreEl) topScoreEl.innerText = top.total_score.toFixed(1);
        if (topNameEl) topNameEl.innerText = `#1 ${top.name_zh || top.name} (${top.nation || 'N/A'})`;
    } else {
        if (topScoreEl) topScoreEl.innerText = '--';
        if (topNameEl) topNameEl.innerText = '无匹配运动员';
    }

    const maxScore = rawDataset[0] ? rawDataset[0].total_score : 1000;

    currentDataset.forEach((ath, idx) => {
        const rankNum = idx + 1;
        let rankClass = 'rank-n';
        if (rankNum === 1) rankClass = 'rank-1';
        else if (rankNum === 2) rankClass = 'rank-2';
        else if (rankNum === 3) rankClass = 'rank-3';

        const barWidth = Math.min(100, Math.round((ath.total_score / maxScore) * 100));
        const og = ath.og || { gold: 0, silver: 0, bronze: 0 };
        const wc = ath.wc || { gold: 0, silver: 0, bronze: 0 };
        const cc = ath.cc || { gold: 0, silver: 0, bronze: 0 };
        const cg = ath.cg || { gold: 0, silver: 0, bronze: 0 };

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${rankNum}</span></td>
            <td>
                <div class="ath-name">
                    <span>${ath.name_zh || ath.name}</span>
                    <span class="tag-nation">${ath.nation || ''}</span>
                </div>
                <div class="ath-sub">${ath.name} | ${ath.best_class || ''} (${ath.active_years || ath.era_category || ''})</div>
            </td>
            <td class="medals-cell">
                <span class="m-g">${og.gold || 0}G</span> 
                <span class="m-s">${og.silver || 0}S</span> 
                <span class="m-b">${og.bronze || 0}B</span>
            </td>
            <td class="medals-cell">
                <span class="m-g">${wc.gold || 0}G</span> 
                <span class="m-s">${wc.silver || 0}S</span> 
                <span class="m-b">${wc.bronze || 0}B</span>
            </td>
            <td class="medals-cell">
                <span>${(cc.gold || 0) + (cg.gold || 0)}G</span>
                <span style="color:var(--text-muted);font-size:11px;">(${cc.gold || 0}锦/${cg.gold || 0}运)</span>
            </td>
            <td>
                <span style="font-weight:700; color:${(ath.wr_count || 0) >= 20 ? 'var(--accent-cyan)' : '#cbd5e1'};">
                    ${ath.wr_count || 0} 次
                </span>
            </td>
            <td>
                <div class="score-box">${ath.total_score.toFixed(1)}</div>
                <div class="score-bar"><div class="score-fill" style="width: ${barWidth}%;"></div></div>
            </td>
            <td style="text-align: right;">
                <button class="btn-detail" onclick="showDetail('${ath.id}')">架构明细</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showDetail(id) {
    const ath = rawDataset.find(a => a.id === id);
    if (!ath) return;

    document.getElementById('modal-name').innerText = `${ath.name_zh || ath.name} (${ath.name})`;
    document.getElementById('modal-sub').innerText = `代表队: ${ath.nation || 'N/A'} | 活跃时期: ${ath.active_years || ath.era_category || 'N/A'} | 代表级别: ${ath.best_class || 'N/A'}`;
    document.getElementById('modal-peak').innerText = ath.peak_note || '暂无纪录备注';
    
    document.getElementById('b-og').innerText = `${ath.score_breakdown.olympics} 分`;
    document.getElementById('b-wc').innerText = `${ath.score_breakdown.worlds} 分`;
    document.getElementById('b-cont').innerText = `${(ath.score_breakdown.continental_champ + ath.score_breakdown.continental_games).toFixed(1)} 分`;
    document.getElementById('b-wr').innerText = `${ath.score_breakdown.world_records} 分 (${ath.wr_count}次破纪录)`;
    document.getElementById('b-peak').innerText = `${ath.score_breakdown.peak} 分`;
    
    document.getElementById('modal-summary').innerText = ath.summary || '暂无详细生平概况。';
    document.getElementById('detailModal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.remove('active');
}

function resetDefaults() {
    const setSlider = (id, lblId, val) => {
        const input = document.getElementById(id);
        const lbl = document.getElementById(lblId);
        if (input) input.value = val;
        if (lbl) lbl.innerText = val;
    };

    setSlider('w_og_gold', 'lbl_og_gold', 100);
    setSlider('w_wc_gold', 'lbl_wc_gold', 35);
    setSlider('w_cc_gold', 'lbl_cc_gold', 12);
    setSlider('w_cg_gold', 'lbl_cg_gold', 10);
    setSlider('w_wr_point', 'lbl_wr_point', 4.5);
    setSlider('w_peak_scale', 'lbl_peak_scale', 1.0);

    // 重置过滤项
    const searchEl = document.getElementById('filter-search');
    const weightEl = document.getElementById('filter-weight');
    const eraEl = document.getElementById('filter-era');
    if (searchEl) searchEl.value = '';
    if (weightEl) weightEl.value = 'ALL';
    if (eraEl) eraEl.value = 'ALL';

    const defaultBtn = document.querySelector('.filter-btn');
    setGenderFilter('ALL', defaultBtn);
    recalculateServer();
}

window.onload = recalculateServer;