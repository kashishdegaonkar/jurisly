/**
 * Jurisly — UI Interactions
 * Handles modals, toasts, tabs, drag-drop, and visual state.
 */

/* ══ TOAST ════════════════════════════════════════ */
function showToast(ico, title, sub) {
  document.getElementById("toastIco").textContent = ico;
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastSub").textContent = sub;
  const t = document.getElementById("toast");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

/* ══ MODAL ════════════════════════════════════════ */
function openModal(id) {
  const c = CASES.find((x) => x.id === id);
  if (!c) return;

  document.getElementById("modalTitle").textContent = c.title;
  document.getElementById("modalBody").innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:18px">
      <span class="pill p-cit">${c.cit}</span>
      <span class="pill p-yr">${c.year}</span>
      <span class="pill p-tp">${c.type}</span>
    </div>
    <div class="detail-grid" style="margin-bottom:14px">
      <div class="d-block">
        <div class="d-head">Parties</div>
        <div class="d-row"><span class="d-k">Petitioner</span><span class="d-v">${c.pet}</span></div>
        <div class="d-row"><span class="d-k">Respondent</span><span class="d-v">${c.res}</span></div>
        <div class="d-row"><span class="d-k">Disposal</span><span class="d-v">${c.disp}</span></div>
        <div class="d-row"><span class="d-k">Bench Size</span><span class="d-v">${c.bench} judges</span></div>
        <div class="d-row"><span class="d-k">Author Judge</span><span class="d-v">${c.author}</span></div>
      </div>
      <div class="d-block">
        <div class="d-head">Relevance Scores</div>
        <div class="srow"><div class="slabel"><span>Text Relevance</span><span style="color:var(--gold)">${Math.round(c.tfidf * 100)}%</span></div><div class="strack"><div class="sfill sf1" style="width:${Math.round(c.tfidf * 100)}%"></div></div></div>
        <div class="srow"><div class="slabel"><span>Context Understanding</span><span style="color:var(--teal)">${Math.round(c.bert * 100)}%</span></div><div class="strack"><div class="sfill sf2" style="width:${Math.round(c.bert * 100)}%"></div></div></div>
        <div class="srow"><div class="slabel"><span>Citation Relevance</span><span style="color:#6366f1">${Math.round(c.graph * 100)}%</span></div><div class="strack"><div class="sfill sf3" style="width:${Math.round(c.graph * 100)}%"></div></div></div>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;display:flex;justify-content:space-between"><span style="color:var(--muted)">Combined Score</span><strong style="color:var(--crimson)">${Math.round(c.score * 100)}%</strong></div>
      </div>
    </div>
    <div class="seg-block" style="margin-bottom:16px">
      <div class="seg-h">Matching Segments</div>
      ${c.segs.map((s) => `<div class="seg">${s}</div>`).join("")}
    </div>
    <div style="margin-bottom:16px">
      <div class="seg-h" style="margin-bottom:8px">Provisions Cited</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${c.acts.map((a) => `<span class="act">${a}</span>`).join("")}</div>
    </div>
    <div style="margin-bottom:8px">
      <div class="seg-h" style="margin-bottom:8px">Full Bench</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.7">${c.judge.split("·").join("<br>")}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap">
      <button class="btn-primary" style="font-size:13px;padding:9px 18px" onclick="copyCit('${c.cit}')">📋 Copy Citation</button>
      <button class="btn-outline" style="font-size:13px;padding:9px 18px" onclick="closeOverlay()">Close</button>
    </div>`;

  document.getElementById("overlay").classList.add("open");
}

function closeOverlay() {
  document.getElementById("overlay").classList.remove("open");
}

/* ══ TABS ═════════════════════════════════════════ */
function switchTab(tab, btn) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  ["text", "upload", "cite"].forEach(
    (t) => (document.getElementById("tab-" + t).style.display = t === tab ? "block" : "none")
  );
}

/* ══ UPLOAD / DRAG-DROP ═══════════════════════════ */
function doDragOver(e) {
  e.preventDefault();
  document.getElementById("dropZone").classList.add("drag");
}
function doDragLeave() {
  document.getElementById("dropZone").classList.remove("drag");
}
function doDrop(e) {
  e.preventDefault();
  doDragLeave();
  if (e.dataTransfer.files[0]) handleFile({ target: { files: e.dataTransfer.files } });
}
function handleFile(e) {
  const f = e.target.files[0];
  document.getElementById("dropZone").innerHTML = `<div class="upload-ico">✅</div><div class="upload-txt">${f.name}</div><div class="upload-sub">${(f.size / 1024).toFixed(1)} KB — ready to analyze</div>`;
  showToast("📄", "File ready", f.name);
}

/* ══ CITATION QUICKSET ════════════════════════════ */
function setQuickCite(el) {
  document.getElementById("citeInput").value = el.textContent.trim();
}

/* ══ CLIPBOARD ════════════════════════════════════ */
function copyCit(txt) {
  navigator.clipboard.writeText(txt).catch(() => {});
  showToast("📋", "Copied!", txt);
}

/* ══ NAV SCROLL HIGHLIGHT ═════════════════════════ */
window.addEventListener("scroll", () => {
  const sy = scrollY;
  ["search", "how", "tech"].forEach((id) => {
    const elId = id === "tech" ? "techstack" : id;
    const el = document.getElementById(elId);
    const link = document.getElementById("nl-" + id);
    if (!el || !link) return;
    const active = sy >= el.offsetTop - 120 && sy < el.offsetTop + el.offsetHeight - 120;
    link.classList.toggle("active", active);
  });
});

/* ══ KEYBOARD SHORTCUT ════════════════════════════ */
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    focusSearch();
  }
});
