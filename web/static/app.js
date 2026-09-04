/**
 * ==============================================================================
 * IWF GOAT ANALYTICS SYSTEM - FRONTEND CLIENT CONTROLLER
 * 架构职责：状态驱动视图、防抖动态请求、本地过滤排序与报表导出
 * ==============================================================================
 */

let rawDataset = [];
let activeFilters = {
    gender: 'ALL',
    era: 'ALL',
    weight: 'ALL',
    search: ''
};

const weightSliders = [
    { id: 'w_og_gold', key: 'og_gold', lbl: 'lbl_og_gold' },
    { id: 'w_wc_gold', key: 'wc_gold', lbl: 'lbl_wc_gold' },
    { id: 'w_cc_gold', key: 'cc_gold', lbl: 'lbl_cc_gold' },
    { id: 'w_cg_gold', key: 'cg_gold', lbl: 'lbl_cg_gold' },
    { id: 'w_wr_point', key: 'wr_point', lbl: 'lbl_wr_point' },
    { id: 'w_peak_scale', key: 'peak_scale', lbl: 'lbl_peak_scale' }
];

// 初始化滑动条监听
weightSliders.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        document.getElementById(item.lbl).innerText = e.target.value;
        debounceCalculate();
    });
});

let debounceTimer = null;
function debounceCalculate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(recalculateServer, 100);
}

/**
 * 获取当前滑动条激活权重，严格遵循单一真理源的银牌40%、铜牌20%衰减比
 */
function getActiveWeights() {
    const og_g = parseFloat(document.getElementById('w_og_gold').value);
    const wc_g = parseFloat(document.getElementById('w_wc_gold').value);
    const cc_g = parseFloat(document.getElementById('w_cc_gold').value);
    const cg_g = parseFloat(document.getElementById('w_cg_gold').value);
    
    return {
        og_gold: og_g,
        og_silver: og_g * 0.40,
        og_bronze: og_g * 0.20,
        wc_gold: wc_g,
        wc_silver: wc_g * 0.40,
        wc_bronze: wc_g * 0.20,
        cc_gold: cc_g,
        cc_silver: cc_g * 0.40,
        cc_bronze: cc_g * 0.20,
        cg_gold: cg_g,
        cg_silver: cg_g * 0.40,
        cg_bronze: cg_g * 0.20,
        wr_point: parseFloat(document.getElementById('w_wr_point').value),
        peak_scale: parseFloat(document.getElementById('w_peak_scale').value)
    };
}

/**
 * 向后端推送权重并拉取边际递减量化重算结果
 */
async function recalculateServer() {
    const weights = getActiveWeights();
    try {
        const res = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(weights)
        });
        rawDataset = await res.json();
        
        // 实时汇总破纪录总数
        const totalWR = rawDataset.reduce((acc, cur) => acc + cur.wr_count, 0);
        document.getElementById('kpi-total-wr').innerText = `${totalWR} 次`;
        
        applyFilters();
    } catch (err) {
        console.error('[Engine Client Error] 动态计算失败:', err);
    }
}

function setFilter(type, val, btn) {
    activeFilters[type] = val;
    const parent = btn.parentElement;
    parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
}

function applyFilters() {
    const searchVal = document.getElementById('search-input').value.trim().toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    let filtered = rawDataset.filter(item => {
        if (activeFilters.gender !== 'ALL' && item.gender !== activeFilters.gender) return false;
        if (activeFilters.era !== 'ALL' && item.era_category !== activeFilters.era) return false;
        if (activeFilters.weight !== 'ALL' && item.weight_group !== activeFilters.weight) return false;
        if (searchVal) {
            const matchNameZh = item.name_zh.toLowerCase().includes(searchVal);
            const matchNameEn = item.name.toLowerCase().includes(searchVal);
            const matchNation = item.nation.toLowerCase().includes(searchVal);
            if (!matchNameZh && !matchNameEn && !matchNation) return false;
        }
        return true;
    });

    // 动态排序
    filtered.sort((a, b) => {
        if (sortBy === 'total_score') return b.total_score - a.total_score;
        if (sortBy === 'og_gold') return b.og.gold - a.og.gold;
        if (sortBy === 'wc_gold') return b.wc.gold - a.wc.gold;
        if (sortBy === 'wr_count') return b.wr_count - a.wr_count;
        if (sortBy === 'peak_coefficient') return b.peak_coefficient - a.peak_coefficient;
        return 0;
    });

    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '';

    document.getElementById('kpi-count').innerText = `${data.length} / ${rawDataset.length} 人`;

    if (data.length > 0) {
        const top = data[0];
        document.getElementById('kpi-top-score').innerText = top.total_score.toFixed(1);
        document.getElementById('kpi-top-name').innerText = `#1 ${top.name_zh} (${top.nation})`;
    }

    const maxScore = rawDataset[0] ? rawDataset[0].total_score : 1000;

    data.forEach((ath, idx) => {
        const rankNum = idx + 1;
        let rankClass = 'rank-n';
        if (rankNum === 1) rankClass = 'rank-1';
        else if (rankNum === 2) rankClass = 'rank-2';
        else if (rankNum === 3) rankClass = 'rank-3';

        const barWidth = Math.min(100, Math.round((ath.total_score / maxScore) * 100));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${rankNum}</span></td>
            <td>
                <div class="ath-name">
                    <span>${ath.name_zh}</span>
                    <span class="tag-nation">${ath.nation}</span>
                    <span class="tag-era">${ath.era_category}</span>
                </div>
                <div class="ath-sub">${ath.name} | ${ath.best_class} (${ath.active_years})</div>
            </td>
            <td class="medals-cell">
                <span class="m-g">${ath.og.gold}G</span> 
                <span class="m-s">${ath.og.silver}S</span> 
                <span class="m-b">${ath.og.bronze}B</span>
            </td>
            <td class="medals-cell">
                <span class="m-g">${ath.wc.gold}G</span> 
                <span class="m-s">${ath.wc.silver}S</span> 
                <span class="m-b">${ath.wc.bronze}B</span>
            </td>
            <td class="medals-cell">
                <span>${ath.cc.gold + ath.cg.gold}G</span>
                <span style="color:var(--text-muted);font-size:11px;">(${ath.cc.gold}锦/${ath.cg.gold}运)</span>
            </td>
            <td>
                <span style="font-weight:700; color:${ath.wr_count >= 20 ? 'var(--accent-cyan)' : '#cbd5e1'};">
                    ${ath.wr_count} 次
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

    document.getElementById('modal-name').innerText = `${ath.name_zh} (${ath.name})`;
    document.getElementById('modal-sub').innerText = `代表队: ${ath.nation} | 生涯跨度: ${ath.active_years} | 代表级别: ${ath.best_class}`;
    document.getElementById('modal-peak').innerText = ath.peak_note;
    
    document.getElementById('b-og').innerText = `${ath.score_breakdown.olympics} 分`;
    document.getElementById('b-wc').innerText = `${ath.score_breakdown.worlds} 分`;
    document.getElementById('b-cont').innerText = `${(ath.score_breakdown.continental_champ + ath.score_breakdown.continental_games).toFixed(1)} 分`;
    document.getElementById('b-wr').innerText = `${ath.score_breakdown.world_records} 分 (${ath.wr_count}次改写WR)`;
    document.getElementById('b-peak').innerText = `${ath.score_breakdown.peak} 分`;
    
    document.getElementById('modal-summary').innerText = ath.summary;
    document.getElementById('detailModal').classList.add('active');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function resetDefaults() {
    document.getElementById('w_og_gold').value = 100;
    document.getElementById('lbl_og_gold').innerText = "100";
    document.getElementById('w_wc_gold').value = 35;
    document.getElementById('lbl_wc_gold').innerText = "35";
    document.getElementById('w_cc_gold').value = 12;
    document.getElementById('lbl_cc_gold').innerText = "12";
    document.getElementById('w_cg_gold').value = 10;
    document.getElementById('lbl_cg_gold').innerText = "10";
    document.getElementById('w_wr_point').value = 4.5;
    document.getElementById('lbl_wr_point').innerText = "4.5";
    document.getElementById('w_peak_scale').value = 1.0;
    document.getElementById('lbl_peak_scale').innerText = "1.0";
    recalculateServer();
}

function exportCSV() {
    let csv = "排名,中文姓名,英文姓名,国籍,性别,时代断代,代表级别,奥运金,奥运银,奥运铜,世锦总金,世锦总银,世锦总铜,洲际金,破纪录次数,GOAT得分\n";
    rawDataset.forEach((item, index) => {
        csv += `${index + 1},"${item.name_zh}","${item.name}","${item.nation}","${item.gender}","${item.era_category}","${item.best_class}",${item.og.gold},${item.og.silver},${item.og.bronze},${item.wc.gold},${item.wc.silver},${item.wc.bronze},${item.cc.gold + item.cg.gold},${item.wr_count},${item.total_score}\n`;
    });
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "IWF_Weightlifting_GOAT_Rankings_v2.csv";
    link.click();
}

window.addEventListener('DOMContentLoaded', recalculateServer);
