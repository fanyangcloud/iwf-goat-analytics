/**
 * web/static/app.js
 * 核心逻辑：数据完全由后端 JSON 驱动，多维过滤防崩溃，动态统计指标，轻量化声明式 i18n
 */

let rawDataset = [];       // 服务端返回的基准全量排行榜
let currentDataset = [];   // 经过条件过滤后的当前展示集
let currentLang = localStorage.getItem('iwf_lang') || 'zh';

// 国际化词汇矩阵 (严格对齐 IWF 官方术语标准)
const I18N = {
    zh: {
        page_title: "IWF 举重历史 GOAT 数据系统",
        engine_title: "IWF GOAT ANALYTICS SYSTEM",
        engine_sub: "举重历史巨星全维评分与量化排序系统 (JSON 驱动中台)",
        status_badge: "STATUS: JSON-DRIVEN ACTIVE",
        kpi_athlete_count: "收录巨星总数",
        kpi_athlete_desc: "根据 data/ 目录下的 JSON 大小动态统计",
        kpi_wr_count: "统计打破世界纪录总次数",
        kpi_wr_desc: "全量 JSON 数据内 wr_count 字段动态累加",
        kpi_top_score: "历史榜首现任得分",
        kpi_calc_norm: "数据归一化口径",
        kpi_norm_val: "IWF 大金牌基准",
        kpi_norm_desc: "总成绩(Total)优先，排除小单项通胀",
        panel_title: "评分矩阵参数微调 (Matrix Weights)",
        lbl_og: "奥运金牌权重",
        lbl_wc: "世锦赛总成绩金牌",
        lbl_cc: "洲际锦标赛金牌",
        lbl_cg: "洲际运动会金牌",
        lbl_wr: "打破世界纪录 (每次)",
        lbl_peak: "时代巅峰表现系数倍率",
        btn_reset: "恢复基准预设",
        filter_all_gender: "全部性别",
        filter_m: "男子组 (M)",
        filter_f: "女子组 (F)",
        opt_all_weights: "全部量级梯队",
        opt_light: "小量级 (LIGHT)",
        opt_middle: "中量级 (MIDDLE)",
        opt_heavy: "重量级/超重 (HEAVY)",
        opt_all_eras: "全部历史时代",
        opt_era_1: "1950-1979 (冷战早期/上古)",
        opt_era_2: "1980-1999 (巅峰两极对抗)",
        opt_era_3: "2000-至今 (现代举重新规)",
        search_placeholder: "搜索姓名/国籍...",
        th_rank: "排名",
        th_ath: "运动员 / 级别年代",
        th_og: "奥运会 (G/S/B)",
        th_wc: "世锦赛 (G/S/B)",
        th_cont: "洲际赛 (锦/运)",
        th_wr: "破WR",
        th_score: "GOAT 指数",
        th_detail: "深度分析",
        btn_detail: "架构明细",
        unit_person: "人",
        unit_times: "次",
        no_match: "无匹配运动员",
        modal_peak_lbl: "巅峰与最好成绩标杆：",
        modal_b_og: "奥运会积分贡献",
        modal_b_wc: "世锦赛积分贡献",
        modal_b_cont: "洲际赛事积分 (锦标+运动会)",
        modal_b_wr: "破世界纪录积分贡献",
        modal_b_peak: "时代峰值统治力修正得分",
        cont_split: "锦/运"
    },
    en: {
        page_title: "IWF Weightlifting Historical GOAT Analytics",
        engine_title: "IWF GOAT ANALYTICS SYSTEM",
        engine_sub: "Historical Weightlifting Hall of Fame Metric Engine (JSON Driven)",
        status_badge: "STATUS: JSON-DRIVEN ACTIVE",
        kpi_athlete_count: "Athletes Profiled",
        kpi_athlete_desc: "Dynamically evaluated from athlete registry",
        kpi_wr_count: "Total World Records Broken",
        kpi_wr_desc: "Accumulated wr_count metrics across dataset",
        kpi_top_score: "Historical #1 Score",
        kpi_calc_norm: "Normalization Scale",
        kpi_norm_val: "IWF Total-Standard",
        kpi_norm_desc: "Priority on Olympic Total, avoiding snatch/C&J inflation",
        panel_title: "Matrix Weights Calibration",
        lbl_og: "Olympic Games Gold",
        lbl_wc: "World Champ Total Gold",
        lbl_cc: "Continental Champ Gold",
        lbl_cg: "Continental Games Gold",
        lbl_wr: "World Record Bonus (Per)",
        lbl_peak: "Peak Era Multiplier",
        btn_reset: "Reset Defaults",
        filter_all_gender: "All Genders",
        filter_m: "Men's (M)",
        filter_f: "Women's (F)",
        opt_all_weights: "All Weight Classes",
        opt_light: "Lightweight (LIGHT)",
        opt_middle: "Middleweight (MIDDLE)",
        opt_heavy: "Heavyweight (HEAVY)",
        opt_all_eras: "All Historical Eras",
        opt_era_1: "1950-1979 (Early Cold War)",
        opt_era_2: "1980-1999 (Dual Pole Peak)",
        opt_era_3: "2000-Present (Modern Era)",
        search_placeholder: "Search name/nation...",
        th_rank: "Rank",
        th_ath: "Athlete / Class & Era",
        th_og: "OG (G/S/B)",
        th_wc: "WC (G/S/B)",
        th_cont: "Continental (C/G)",
        th_wr: "WR Breaks",
        th_score: "GOAT Score",
        th_detail: "Diagnostics",
        btn_detail: "Analysis",
        unit_person: "Athletes",
        unit_times: "Times",
        no_match: "No athletes matched",
        modal_peak_lbl: "Historical Peak Benchmarks: ",
        modal_b_og: "Olympic Points",
        modal_b_wc: "World Champ Points",
        modal_b_cont: "Continental Points",
        modal_b_wr: "WR Bonus Points",
        modal_b_peak: "Era Domination Bonus",
        cont_split: "C/G"
    }
};

function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('iwf_lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    // 1. 自动同步所有声明 data-i18n 标签的静态文本
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (I18N[currentLang][k]) el.innerText = I18N[currentLang][k];
    });

    // 2. 自动同步属性类翻译
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const k = el.getAttribute('data-i18n-placeholder');
        if (I18N[currentLang][k]) el.placeholder = I18N[currentLang][k];
    });

    // 3. 更新切换按钮高亮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // 4. 重绘动态数据表格与 KPI 聚合
    updateKpis();
    renderTable();
}

// 筛选状态字典
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

function updateKpis() {
    const athleteCountEl = document.getElementById('kpi-athlete-count');
    if (athleteCountEl) {
        athleteCountEl.innerText = `${rawDataset.length} ${t('unit_person')}`;
    }

    const totalWR = rawDataset.reduce((sum, item) => sum + (Number(item.wr_count) || 0), 0);
    const totalWREl = document.getElementById('kpi-total-wr');
    if (totalWREl) {
        totalWREl.innerText = `${totalWR} ${t('unit_times')}`;
    }
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
        
        updateKpis();
        applyFilters();

    } catch (err) {
        console.error("[Engine Client Error] 动态计算失败:", err);
    }
}

function applyFilters() {
    const weightEl = document.getElementById('filter-weight');
    const eraEl = document.getElementById('filter-era');
    const searchEl = document.getElementById('filter-search');

    filterState.weightGroup = weightEl ? weightEl.value : 'ALL';
    filterState.era = eraEl ? eraEl.value : 'ALL';
    filterState.keyword = searchEl ? searchEl.value.trim().toLowerCase() : '';

    currentDataset = rawDataset.filter(item => {
        if (filterState.gender !== 'ALL' && item.gender !== filterState.gender) return false;
        if (filterState.weightGroup !== 'ALL' && item.weight_group !== filterState.weightGroup) return false;
        if (filterState.era !== 'ALL' && item.era_category !== filterState.era) return false;
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

function setGenderFilter(gender, btnElement) {
    filterState.gender = gender;
    document.querySelectorAll('.filter-gender-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    applyFilters();
}

function renderTable() {
    const tbody = document.getElementById('ranking-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const topScoreEl = document.getElementById('kpi-top-score');
    const topNameEl = document.getElementById('kpi-top-name');
    if (currentDataset.length > 0) {
        const top = currentDataset[0];
        const displayTopName = currentLang === 'zh' ? (top.name_zh || top.name) : top.name;
        if (topScoreEl) topScoreEl.innerText = top.total_score.toFixed(1);
        if (topNameEl) topNameEl.innerText = `#1 ${displayTopName} (${top.nation || 'N/A'})`;
    } else {
        if (topScoreEl) topScoreEl.innerText = '--';
        if (topNameEl) topNameEl.innerText = t('no_match');
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

        const primaryName = currentLang === 'zh' ? (ath.name_zh || ath.name) : ath.name;
        const subName = currentLang === 'zh' ? ath.name : (ath.name_zh || '');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${rankNum}</span></td>
            <td>
                <div class="ath-name">
                    <span>${primaryName}</span>
                    <span class="tag-nation">${ath.nation || ''}</span>
                </div>
                <div class="ath-sub">${subName ? subName + ' | ' : ''}${ath.best_class || ''} (${ath.active_years || ath.era_category || ''})</div>
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
                <span style="color:var(--text-muted);font-size:11px;">(${cc.gold || 0}/${cg.gold || 0} ${t('cont_split')})</span>
            </td>
            <td>
                <span style="font-weight:700; color:${(ath.wr_count || 0) >= 20 ? 'var(--accent-cyan)' : '#cbd5e1'};">
                    ${ath.wr_count || 0} ${t('unit_times')}
                </span>
            </td>
            <td>
                <div class="score-box">${ath.total_score.toFixed(1)}</div>
                <div class="score-bar"><div class="score-fill" style="width: ${barWidth}%;"></div></div>
            </td>
            <td style="text-align: right;">
                <button class="btn-detail" onclick="showDetail('${ath.id}')">${t('btn_detail')}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showDetail(id) {
    const ath = rawDataset.find(a => a.id === id);
    if (!ath) return;

    const isEn = currentLang === 'en';

    // 1. 标题与副标题对齐国际化
    const titleName = isEn 
        ? `${ath.name} (${ath.name_zh || ath.nation})`
        : `${ath.name_zh || ath.name} (${ath.name})`;

    document.getElementById('modal-name').innerText = titleName;
    document.getElementById('modal-sub').innerText = `Team: ${ath.nation || 'N/A'} | Era: ${ath.active_years || ath.era_category || 'N/A'} | Class: ${ath.best_class || 'N/A'}`;
    
    // 2. 巅峰成绩与生平概况：防御性提取英文（无英文则平滑回退）
    const peakText = isEn ? (ath.peak_note_en || ath.peak_note) : ath.peak_note;
    const summaryText = isEn ? (ath.summary_en || ath.summary) : ath.summary;

    document.getElementById('modal-peak').innerText = peakText || '--';
    document.getElementById('modal-summary').innerText = summaryText || '--';

    // 3. 积分明细
    document.getElementById('b-og').innerText = `${ath.score_breakdown.olympics} pts`;
    document.getElementById('b-wc').innerText = `${ath.score_breakdown.worlds} pts`;
    document.getElementById('b-cont').innerText = `${(ath.score_breakdown.continental_champ + ath.score_breakdown.continental_games).toFixed(1)} pts`;
    document.getElementById('b-wr').innerText = `${ath.score_breakdown.world_records} pts (${ath.wr_count} WR)`;
    document.getElementById('b-peak').innerText = `${ath.score_breakdown.peak} pts`;
    
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

    const searchEl = document.getElementById('filter-search');
    const weightEl = document.getElementById('filter-weight');
    const eraEl = document.getElementById('filter-era');
    if (searchEl) searchEl.value = '';
    if (weightEl) weightEl.value = 'ALL';
    if (eraEl) eraEl.value = 'ALL';

    const defaultBtn = document.querySelector('.filter-gender-btn');
    setGenderFilter('ALL', defaultBtn);
    recalculateServer();
}

window.onload = () => {
    setLanguage(currentLang);
    recalculateServer();
};