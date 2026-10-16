/* Study Tracker Generator — starter JavaScript
   This is a minimal working scaffold. Customize the generation and storage logic. */

"use strict";

const CONFIG_KEY = "studyTrackerGeneratorConfig";
const PROGRESS_KEY = "studyTrackerGeneratorProgress";

function $(id) {
    return document.getElementById(id);
}

function updateSliderVal(type, value) {
    const output = $(type === "lec" ? "lecVal" : "qVal");
    if (output) output.textContent = value;
}

function readConfig() {
    const ids = [
        "interactiveToggle", "headerSubInput", "headerSubRightInput",
        "targetGoalInput", "totalDaysInput", "daysPerPageInput", "daySubInput",
        "lecCountInput", "qCountInput", "colHwCheck", "colHwLabel",
        "colDppCheck", "colDppLabel", "colPyqCheck", "colPyqLabel",
        "colRevCheck", "colRevLabel", "colCustomCheck", "colCustomLabel"
    ];
    const config = {};
    ids.forEach(id => {
        const el = $(id);
        if (!el) return;
        config[id] = el.type === "checkbox" ? el.checked : el.value;
    });
    return config;
}

function saveConfig() {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(readConfig()));
    } catch (error) {
        console.warn("Could not save configuration:", error);
    }
    renderTracker();
}

function loadConfig() {
    try {
        const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
        if (!saved) return;
        Object.entries(saved).forEach(([id, value]) => {
            const el = $(id);
            if (!el) return;
            if (el.type === "checkbox") el.checked = Boolean(value);
            else el.value = value;
        });
    } catch (error) {
        console.warn("Could not load configuration:", error);
    }
    updateSliderVal("lec", $("lecCountInput")?.value || 2);
    updateSliderVal("q", $("qCountInput")?.value || 10);
}

function renderTracker() {
    const container = $("printContainer");
    if (!container) return;

    const totalDays = Math.max(10, Math.min(365, Number($("totalDaysInput")?.value) || 150));
    const daysPerPage = Math.max(5, Math.min(31, Number($("daysPerPageInput")?.value) || 20));
    const lectureCount = Math.max(1, Math.min(6, Number($("lecCountInput")?.value) || 2));
    const questionCount = Math.max(0, Math.min(20, Number($("qCountInput")?.value) || 10));
    const progress = loadProgress();
    const columns = [
        ["colHwCheck", "colHwLabel", "HW / MODULE"],
        ["colDppCheck", "colDppLabel", "DPP"],
        ["colPyqCheck", "colPyqLabel", "PYQ"],
        ["colRevCheck", "colRevLabel", "REV"],
        ["colCustomCheck", "colCustomLabel", "NOTES"]
    ].filter(([checkId]) => $(checkId)?.checked)
     .map(([, labelId, fallback]) => $(labelId)?.value.trim() || fallback);

    const leftSubtitle = escapeHTML($("headerSubInput")?.value || "YOUR DAILY PLAN");
    const rightSubtitle = escapeHTML($("headerSubRightInput")?.value || "EXAMTRACK");
    const goal = escapeHTML($("targetGoalInput")?.value || "Your study goal");
    const dayTag = escapeHTML($("daySubInput")?.value || "JEE TRACK");

    let html = "";
    for (let start = 1; start <= totalDays; start += daysPerPage) {
        const end = Math.min(totalDays, start + daysPerPage - 1);
        html += `<section class="tracker-page">
            <header style="display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:14px">
                <div><small>${leftSubtitle}</small><h2 style="margin:4px 0">${goal}</h2></div>
                <strong>${rightSubtitle}</strong>
            </header>
            <p style="font-size:11px;color:#4b5563">Days ${start}–${end} · ${dayTag}</p>
            <table><thead><tr><th>DAY</th><th>LECTURES</th><th>QUESTIONS</th>${columns.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
        for (let day = start; day <= end; day++) {
            html += `<tr><td><strong>DAY ${day}</strong><br><small>${dayTag}</small></td><td>${makeChecks(day, "lec", lectureCount, progress)}</td><td>${makeChecks(day, "q", questionCount, progress)}</td>`;
            columns.forEach(col => {
                const key = `d${day}_${col}`;
                const checked = progress[key] ? "checked" : "";
                html += `<td style="text-align:center"><input type="checkbox" aria-label="Day ${day} ${col}" data-progress-key="${escapeHTML(key)}" ${checked}></td>`;
            });
            html += "</tr>";
        }
        html += "</tbody></table></section>";
    }
    container.innerHTML = html;
    container.querySelectorAll("[data-progress-key]").forEach(box => {
        box.addEventListener("change", () => {
            if (!$("interactiveToggle")?.checked) return;
            const all = loadProgress();
            all[box.dataset.progressKey] = box.checked;
            saveProgress(all);
        });
    });
}

function makeChecks(day, type, count, progress) {
    if (!count) return "—";
    let out = '<div style="display:flex;flex-wrap:wrap;gap:5px">';
    for (let i = 1; i <= count; i++) {
        const key = `d${day}_${type}${i}`;
        out += `<label style="display:inline-flex;align-items:center;gap:3px;white-space:nowrap"><input type="checkbox" data-progress-key="${key}" ${progress[key] ? "checked" : ""}>${i}</label>`;
    }
    return out + "</div>";
}

function loadProgress() {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}") || {};
    } catch {
        return {};
    }
}

function saveProgress(progress) {
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
        console.warn("Could not save progress:", error);
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

function exportJSON() {
    const data = {
        config: readConfig(),
        progress: loadProgress()
    };
    downloadFile("study-tracker-backup.json", JSON.stringify(data, null, 2), "application/json");
}

function triggerImport() {
    $("importFile")?.click();
}

function importJSON(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (data.config) {
                Object.entries(data.config).forEach(([id, value]) => {
                    const el = $(id);
                    if (!el) return;
                    if (el.type === "checkbox") el.checked = Boolean(value);
                    else el.value = value;
                });
                localStorage.setItem(CONFIG_KEY, JSON.stringify(data.config));
            }
            if (data.progress) saveProgress(data.progress);
            renderTracker();
            alert("Backup imported.");
        } catch {
            alert("Could not import this file. Please select a valid tracker JSON backup.");
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function clearData() {
    if (!confirm("Clear all saved checkbox progress? This cannot be undone.")) return;
    localStorage.removeItem(PROGRESS_KEY);
    renderTracker();
}

function resetConfig() {
    if (!confirm("Reset settings to the default values?")) return;
    localStorage.removeItem(CONFIG_KEY);
    location.reload();
}

function openCodeModal() {
    const modal = $("codeModal");
    if (!modal) return;
    $("codeTextArea").value = [
        "<!-- index.html -->",
        document.documentElement.outerHTML,
        "",
        "/* style.css */",
        "/* Open style.css to view and edit the stylesheet. */",
        "",
        "/* script.js */",
        "/* Open script.js to view and edit the JavaScript. */"
    ].join("\n");
    modal.classList.add("show");
}

function closeCodeModal() {
    $("codeModal")?.classList.remove("show", "open", "active");
}

async function copyCodeFromModal() {
    const text = $("codeTextArea")?.value || "";
    try {
        await navigator.clipboard.writeText(text);
        alert("Code copied.");
    } catch {
        $("codeTextArea")?.select();
        document.execCommand("copy");
    }
}

function copyCodeModal() {
    openCodeModal();
    copyCodeFromModal();
}

document.addEventListener("DOMContentLoaded", () => {
    loadConfig();
    renderTracker();
});
