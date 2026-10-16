function updateSliderVal(type, val) {
    document.getElementById(type + 'Val').innerText = val;
    generateTracker();
}

function getConfig() {
    return {
        totalDays: parseInt(document.getElementById('totalDaysInput').value) || 150,
        daysPerPage: parseInt(document.getElementById('daysPerPageInput').value) || 20,
        headerSub: document.getElementById('headerSubInput').value,
        headerSubRight: document.getElementById('headerSubRightInput').value,
        targetGoal: document.getElementById('targetGoalInput').value,
        daySub: document.getElementById('daySubInput').value,
        lecCount: parseInt(document.getElementById('lecCountInput').value) || 2,
        qCount: parseInt(document.getElementById('qCountInput').value) || 10,
        interactive: document.getElementById('interactiveToggle').checked,
        cols: {
            hw: { active: document.getElementById('colHwCheck').checked, label: document.getElementById('colHwLabel').value },
            dpp: { active: document.getElementById('colDppCheck').checked, label: document.getElementById('colDppLabel').value },
            pyq: { active: document.getElementById('colPyqCheck').checked, label: document.getElementById('colPyqLabel').value },
            rev: { active: document.getElementById('colRevCheck').checked, label: document.getElementById('colRevLabel').value },
            custom: { active: document.getElementById('colCustomCheck').checked, label: document.getElementById('colCustomLabel').value }
        }
    };
}

function saveConfig() {
    const config = getConfig();
    localStorage.setItem('study_tracker_config', JSON.stringify(config));
    generateTracker();
}

function loadConfig() {
    const saved = localStorage.getItem('study_tracker_config');
    if (!saved) return;
    try {
        const cfg = JSON.parse(saved);
        if (cfg.totalDays !== undefined) document.getElementById('totalDaysInput').value = cfg.totalDays;
        if (cfg.daysPerPage !== undefined) document.getElementById('daysPerPageInput').value = cfg.daysPerPage;
        if (cfg.headerSub !== undefined) document.getElementById('headerSubInput').value = cfg.headerSub;
        if (cfg.headerSubRight !== undefined) document.getElementById('headerSubRightInput').value = cfg.headerSubRight;
        if (cfg.targetGoal !== undefined) document.getElementById('targetGoalInput').value = cfg.targetGoal;
        if (cfg.daySub !== undefined) document.getElementById('daySubInput').value = cfg.daySub;
        if (cfg.lecCount !== undefined) {
            document.getElementById('lecCountInput').value = cfg.lecCount;
            document.getElementById('lecVal').innerText = cfg.lecCount;
        }
        if (cfg.qCount !== undefined) {
            document.getElementById('qCountInput').value = cfg.qCount;
            document.getElementById('qVal').innerText = cfg.qCount;
        }
        if (cfg.interactive !== undefined) document.getElementById('interactiveToggle').checked = cfg.interactive;
        if (cfg.cols) {
            if (cfg.cols.hw) { document.getElementById('colHwCheck').checked = cfg.cols.hw.active; document.getElementById('colHwLabel').value = cfg.cols.hw.label; }
            if (cfg.cols.dpp) { document.getElementById('colDppCheck').checked = cfg.cols.dpp.active; document.getElementById('colDppLabel').value = cfg.cols.dpp.label; }
            if (cfg.cols.pyq) { document.getElementById('colPyqCheck').checked = cfg.cols.pyq.active; document.getElementById('colPyqLabel').value = cfg.cols.pyq.label; }
            if (cfg.cols.rev) { document.getElementById('colRevCheck').checked = cfg.cols.rev.active; document.getElementById('colRevLabel').value = cfg.cols.rev.label; }
            if (cfg.cols.custom) { document.getElementById('colCustomCheck').checked = cfg.cols.custom.active; document.getElementById('colCustomLabel').value = cfg.cols.custom.label; }
        }
    } catch(e) { console.error(e); }
}

function resetConfig() {
    localStorage.removeItem('study_tracker_config');
    localStorage.removeItem('study_tracker_states');
    location.reload();
}

function generateTracker() {
    const config = getConfig();
    const container = document.getElementById('printContainer');
    container.innerHTML = '';

    let savedStates = {};
    if (config.interactive) {
        try {
            savedStates = JSON.parse(localStorage.getItem('study_tracker_states') || '{}');
        } catch(e) {}
    }

    const totalPages = Math.ceil(config.totalDays / config.daysPerPage);

    for (let p = 0; p < totalPages; p++) {
        const startDay = p * config.daysPerPage + 1;
        const endDay = Math.min((p + 1) * config.daysPerPage, config.totalDays);

        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';

        let activeColsCount = 0;
        if (config.cols.hw.active) activeColsCount++;
        if (config.cols.dpp.active) activeColsCount++;
        if (config.cols.pyq.active) activeColsCount++;
        if (config.cols.rev.active) activeColsCount++;
        if (config.cols.custom.active) activeColsCount++;

        let html = `
            <div>
                <div class="page-header">
                    <div class="brand-sub-wrap">
                        <div class="brand-sub">${config.headerSub}</div>
                        <div class="page-title">Days ${startDay}–${endDay} Checklist</div>
                    </div>
                    <div class="target-goal">${config.targetGoal}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 12%;">DAY</th>
                            <th style="width: 17%;">LECTURES</th>
        `;

        if (config.cols.hw.active) html += `<th style="width: 9%;">${config.cols.hw.label}</th>`;
        if (config.cols.dpp.active) html += `<th style="width: 8%;">${config.cols.dpp.label}</th>`;
        if (config.cols.pyq.active) html += `<th style="width: 8%;">${config.cols.pyq.label}</th>`;
        
        let qWidth = 46 - (activeColsCount * 8);
        if (qWidth < 20) qWidth = 20;
        html += `<th style="width: ${qWidth}%;">QUESTIONS (${config.qCount} = ${config.qCount} $\Box$)</th>`;

        if (config.cols.rev.active) html += `<th style="width: 8%;">${config.cols.rev.label}</th>`;
        if (config.cols.custom.active) html += `<th style="width: 10%;">${config.cols.custom.label}</th>`;

        html += `</tr></thead><tbody>`;

        for (let d = startDay; d <= endDay; d++) {
            html += `
                <tr>
                    <td class="day-cell">
                        DAY ${d}
                        <div class="day-sub">${config.daySub}</div>
                    </td>
                    <td>
                        <div class="checkbox-group">
            `;

            for (let l = 0; l < config.lecCount; l++) {
                let id = `d_${d}_lec_${l}`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)">`;
            }

            html += `</div></td>`;

            if (config.cols.hw.active) {
                let id = `d_${d}_col_hw`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<td><input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)"></td>`;
            }
            if (config.cols.dpp.active) {
                let id = `d_${d}_col_dpp`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<td><input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)"></td>`;
            }
            if (config.cols.pyq.active) {
                let id = `d_${d}_col_pyq`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<td><input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)"></td>`;
            }

            html += `<td><div class="checkbox-group">`;
            for (let q = 0; q < config.qCount; q++) {
                let id = `d_${d}_q_${q}`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)">`;
            }
            html += `</div></td>`;

            if (config.cols.rev.active) {
                let id = `d_${d}_col_rev`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<td><input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)"></td>`;
            }
            if (config.cols.custom.active) {
                let id = `d_${d}_col_custom`;
                let checked = savedStates[id] ? 'checked' : '';
                html += `<td><input type="checkbox" class="box-input" data-id="${id}" ${checked} onchange="handleCheckChange(this)"></td>`;
            }

            html += `</tr>`;
        }

        html += `
                    </tbody>
                </table>
            </div>
            <div class="page-footer-info">
                <span>Page ${p + 1} of ${totalPages}</span>
                <span>${config.headerSubRight}</span>
            </div>
        `;

        pageDiv.innerHTML = html;
        container.appendChild(pageDiv);
    }
}

function handleCheckChange(el) {
    const config = getConfig();
    if (!config.interactive) return;
    const id = el.getAttribute('data-id');
    let savedStates = {};
    try {
        savedStates = JSON.parse(localStorage.getItem('study_tracker_states') || '{}');
    } catch(e) {}
    if (el.checked) {
        savedStates[id] = true;
    } else {
        delete savedStates[id];
    }
    localStorage.setItem('study_tracker_states', JSON.stringify(savedStates));
}

function clearData() {
    if (confirm("Are you sure you want to clear all checkbox progress?")) {
        localStorage.removeItem('study_tracker_states');
        generateTracker();
    }
}

function exportJSON() {
    const data = {
        config: getConfig(),
        states: JSON.parse(localStorage.getItem('study_tracker_states') || '{}')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study_tracker_backup.json';
    a.click();
}

function triggerImport() {
    document.getElementById('importFile').click();
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.config) {
                localStorage.setItem('study_tracker_config', JSON.stringify(data.config));
            }
            if (data.states) {
                localStorage.setItem('study_tracker_states', JSON.stringify(data.states));
            }
            location.reload();
        } catch(err) {
            alert("Invalid JSON backup file!");
        }
    };
    reader.readAsText(file);
}

function openCodeModal() {
    const fullCode = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n' + document.body.innerHTML + '\n<script src="script.js"><\/script>\n</body>\n</html>';
    document.getElementById('codeTextArea').value = fullCode;
    document.getElementById('codeModal').style.display = 'flex';
}

function closeCodeModal() {
    document.getElementById('codeModal').style.display = 'none';
}

function copyCodeModal() {
    const fullCode = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n' + document.body.innerHTML + '\n<script src="script.js"><\/script>\n</body>\n</html>';
    navigator.clipboard.writeText(fullCode).then(() => {
        alert('Source code copied to clipboard successfully!');
    });
}

function copyCodeFromModal() {
    const textarea = document.getElementById('codeTextArea');
    textarea.select();
    document.execCommand('copy');
    alert('Source code copied to clipboard successfully!');
}

window.onload = function() {
    loadConfig();
    generateTracker();
};
       
