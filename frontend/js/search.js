/**
 * Jurisly — Search Logic
 * Core search functionality, result rendering, save/compare features.
 */

/* ══ CASE DATA (demo mode — replaced by API in production) ═══ */
const CASES = [
  { id:1, title:"Kesavananda Bharati v. State of Kerala",
    pet:"Kesavananda Bharati", res:"State of Kerala", year:1973, cit:"AIR 1973 SC 1461",
    disp:"Dismissed (majority)", bench:13, judge:"Y.V. Chandrachud · H.R. Khanna · K.S. Hegde · A.N. Ray · D.G. Palekar",
    author:"Y.V. Chandrachud", type:"Constitutional",
    score:.962, tfidf:.940, bert:.980, graph:.952,
    snippet:"The <mark>basic structure doctrine</mark> holds that Parliament cannot amend the Constitution to <mark>destroy its fundamental identity</mark>. Article 368 grants wide amending power but not unlimited power.",
    segs:["The <mark>basic structure</mark> of the Constitution cannot be amended by Parliament — it is inviolable.", "The <mark>amending power</mark> under Article 368 does not extend to altering or destroying the Constitution's essential features."],
    acts:["Article 368","Article 31C","24th Amendment","25th Amendment"] },
  { id:2, title:"Minerva Mills Ltd. v. Union of India",
    pet:"Minerva Mills Ltd.", res:"Union of India", year:1980, cit:"AIR 1980 SC 1789",
    disp:"Allowed (partly)", bench:5, judge:"Y.V. Chandrachud · A.C. Gupta · N.L. Untwalia · P.S. Kailasam · O. Chinnappa Reddy",
    author:"Y.V. Chandrachud", type:"Constitutional",
    score:.884, tfidf:.870, bert:.910, graph:.880,
    snippet:"Sections 4 and 55 of the 42nd Amendment are unconstitutional. <mark>Fundamental Rights</mark> and <mark>Directive Principles</mark> must coexist in harmony — one cannot be used to destroy the other.",
    segs:["The <mark>42nd Amendment</mark> removed judicial review of constitutional amendments — this strikes at the basic structure.", "Harmony between <mark>Fundamental Rights</mark> and Directive Principles is itself an essential feature of the Constitution."],
    acts:["Article 14","Article 19","Article 31","42nd Amendment"] },
  { id:3, title:"Indira Nehru Gandhi v. Raj Narain",
    pet:"Indira Nehru Gandhi", res:"Raj Narain", year:1975, cit:"AIR 1975 SC 2299",
    disp:"Allowed (appeal)", bench:5, judge:"A.N. Ray · H.R. Khanna · K.K. Mathew · M.H. Beg · Y.V. Chandrachud",
    author:"H.R. Khanna", type:"Election Law",
    score:.741, tfidf:.700, bert:.780, graph:.735,
    snippet:"The <mark>39th Amendment</mark> placing the Prime Minister's election beyond judicial review violates the basic structure. <mark>Free and fair elections</mark> are a fundamental constitutional imperative.",
    segs:["The <mark>39th Amendment</mark> ousting court jurisdiction over election disputes of high constitutional functionaries is void.", "Democratic elections form part of the <mark>basic structure</mark> and cannot be abrogated by constitutional amendment."],
    acts:["Representation of People Act","Article 71","39th Amendment"] },
  { id:4, title:"S.R. Bommai v. Union of India",
    pet:"S.R. Bommai", res:"Union of India", year:1994, cit:"AIR 1994 SC 1918",
    disp:"Dismissed", bench:9, judge:"S.R. Pandian · A.M. Ahmadi · Kuldip Singh · J.S. Verma · P.B. Sawant",
    author:"S.R. Pandian", type:"Federalism",
    score:.689, tfidf:.652, bert:.718, graph:.683,
    snippet:"<mark>President's Rule</mark> under Article 356 is subject to judicial review. The floor of the House is the only test for majority. <mark>Secularism</mark> is a basic feature of the Constitution.",
    segs:["<mark>President's Rule</mark> cannot be imposed without giving the Chief Minister an opportunity to prove majority.", "<mark>Secularism and federalism</mark> are integral parts of the basic structure — binding on every organ of State."],
    acts:["Article 356","Article 365","Article 74"] },
  { id:5, title:"I.C. Golaknath v. State of Punjab",
    pet:"I.C. Golaknath", res:"State of Punjab", year:1967, cit:"AIR 1967 SC 1643",
    disp:"Allowed", bench:11, judge:"K. Subba Rao · K.N. Wanchoo · J.C. Shah · S.M. Sikri · R.S. Bachawat",
    author:"K. Subba Rao", type:"Fundamental Rights",
    score:.632, tfidf:.582, bert:.678, graph:.625,
    snippet:"Parliament has no power to amend <mark>Part III</mark> of the Constitution to abridge <mark>Fundamental Rights</mark>. Such rights are transcendental and immutable in character.",
    segs:["<mark>Fundamental Rights</mark> are transcendental and immutable — they cannot be curtailed or abolished even by constitutional amendment.", "Article 368 does not confer power to take away or abridge the <mark>fundamental rights</mark> guaranteed under Part III."],
    acts:["Part III","Article 13","17th Amendment","Article 368"] },
  { id:6, title:"Maneka Gandhi v. Union of India",
    pet:"Maneka Gandhi", res:"Union of India", year:1978, cit:"AIR 1978 SC 597",
    disp:"Allowed", bench:7, judge:"M.H. Beg · Y.V. Chandrachud · V.R. Krishna Iyer · P.N. Bhagwati · N.L. Untwalia",
    author:"P.N. Bhagwati", type:"Fundamental Rights",
    score:.611, tfidf:.580, bert:.645, graph:.600,
    snippet:"The right to travel abroad is part of <mark>personal liberty</mark> under Article 21. Any procedure depriving a person of life or liberty must be <mark>reasonable, fair and just</mark>.",
    segs:["<mark>Article 21</mark> does not merely guarantee life and liberty — it ensures that any deprivation follows a procedure that is fair, just and reasonable.", "The passport authorities cannot impound a passport without giving the holder a <mark>hearing</mark>."],
    acts:["Article 14","Article 19","Article 21","Passport Act 1967"] },
  { id:7, title:"Vishaka v. State of Rajasthan",
    pet:"Vishaka and Others", res:"State of Rajasthan", year:1997, cit:"AIR 1997 SC 3011",
    disp:"Allowed", bench:3, judge:"J.S. Verma · Sujata V. Manohar · B.N. Kripal",
    author:"J.S. Verma", type:"Gender Justice",
    score:.573, tfidf:.540, bert:.610, graph:.560,
    snippet:"<mark>Sexual harassment</mark> at the workplace violates fundamental rights under Articles 14, 19 and 21. Guidelines laid down to prevent <mark>workplace harassment</mark>.",
    segs:["<mark>Sexual harassment</mark> at workplace is a violation of the fundamental rights of gender equality and the right to life and liberty.", "The Court laid down detailed <mark>Vishaka Guidelines</mark> to be followed by all employers."],
    acts:["Article 14","Article 15","Article 19(1)(g)","Article 21"] },
  { id:8, title:"A.K. Gopalan v. State of Madras",
    pet:"A.K. Gopalan", res:"State of Madras", year:1950, cit:"AIR 1950 SC 27",
    disp:"Dismissed", bench:6, judge:"H.J. Kania · M. Patanjali Sastri · Mehr Chand Mahajan · S.R. Das · B.K. Mukherjea · S.R. Das",
    author:"H.J. Kania", type:"Preventive Detention",
    score:.521, tfidf:.490, bert:.555, graph:.510,
    snippet:"Each <mark>Fundamental Right</mark> is a self-contained code. The <mark>Preventive Detention Act</mark> does not violate Article 21 if it follows the procedure established by law.",
    segs:["The court adopted a narrow interpretation — <mark>procedure established by law</mark> means any procedure enacted by legislature.", "Each Article in Part III is <mark>mutually exclusive</mark> — violation of one right cannot be tested against another."],
    acts:["Article 19","Article 21","Article 22","Preventive Detention Act 1950"] },
];

/* ══ STATE ════════════════════════════════════════ */
let savedCases = [];
let compareCases = [];
let compareMode = false;
let currentResults = [...CASES];
let useBackendAPI = true; // Toggle to true when backend is running

/* ══ HERO SEARCH ══════════════════════════════════ */
document.getElementById("heroText").addEventListener("input", function () {
  document.getElementById("hcCount").textContent = this.value.length + " chars";
  document.getElementById("mainText").value = this.value;
  document.getElementById("charCount").textContent = this.value.length + " chars";
});
document.getElementById("mainText").addEventListener("input", function () {
  document.getElementById("charCount").textContent = this.value.length + " chars";
});

function heroRun() {
  const v = document.getElementById("heroText").value.trim();
  if (v.length < 10) { showToast("⚠", "Too short", "Enter more text to analyze"); return; }
  const btn = document.getElementById("hcBtn");
  btn.disabled = true; btn.textContent = "…";
  const prog = document.getElementById("hcProg"), fill = document.getElementById("hcFill");
  const lbl = document.getElementById("hcLbl");
  prog.style.display = "block"; lbl.style.display = "block";
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(p + Math.random() * 13, 90); fill.style.width = p + "%";
    lbl.textContent = p < 30 ? "Processing text…" : p < 65 ? "Understanding legal context…" : "Matching precedents…";
  }, 80);
  setTimeout(() => {
    clearInterval(iv); fill.style.width = "100%";
    setTimeout(() => {
      prog.style.display = "none"; lbl.style.display = "none"; fill.style.width = "0";
      btn.disabled = false; btn.textContent = "Analyze →";
      renderHeroResults();
      showToast("✅", "Done", "Top 3 similar cases found");
    }, 200);
  }, 1700);
}

function renderHeroResults() {
  const box = document.getElementById("hcResults");
  box.style.display = "block"; box.innerHTML = "";
  CASES.slice(0, 3).forEach((c, i) => {
    const pct = Math.round(c.score * 100);
    const sc = c.score > .85 ? "pr-h" : c.score > .70 ? "pr-m" : "pr-l";
    const div = document.createElement("div");
    div.className = "pr-row"; div.style.animationDelay = i * .07 + "s";
    div.onclick = () => openModal(c.id);
    div.innerHTML = `<div class="pr-rank ${sc}"><span>${pct}</span><span class="pr-pct">%</span></div>
      <div class="pr-info">
        <div class="pr-name">${c.title}</div>
        <div class="pr-meta"><span class="chip c-y">${c.year}</span><span class="chip c-t">${c.type}</span></div>
      </div>`;
    box.appendChild(div);
  });
}

/* ══ MAIN SEARCH ══════════════════════════════════ */
function focusSearch() {
  document.getElementById("search").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => document.getElementById("mainText").focus(), 600);
}

function loadSample() {
  const sample = `The petitioner challenges the constitutional validity of the 42nd Constitutional Amendment Act, 1976. It is contended that the amendment violates the basic structure doctrine as enunciated by this Court in Kesavananda Bharati v. State of Kerala. The Directive Principles of State Policy, while important, cannot be used to abridge Fundamental Rights under Articles 14, 19 and 21 of the Constitution. Parliament's amending power under Article 368 has inherent limitations.`;
  document.getElementById("mainText").value = sample;
  document.getElementById("charCount").textContent = sample.length + " chars";
  document.getElementById("heroText").value = sample;
  document.getElementById("hcCount").textContent = sample.length + " chars";
  showToast("📝", "Sample loaded", "Constitutional law sample text ready");
}

async function runSearch() {
  const v = document.getElementById("mainText").value.trim() || document.getElementById("citeInput").value.trim();
  if (v.length < 5) { showToast("⚠", "Input needed", "Enter text or a citation to search"); return; }

  const btn = document.getElementById("runBtn"); btn.disabled = true;
  const prog = document.getElementById("ipProg"), fill = document.getElementById("ipFill");
  prog.style.display = "block";
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("skelContainer").style.display = "block";
  document.getElementById("resultsList").innerHTML = "";
  document.getElementById("resTopBar").style.display = "none";

  // Try backend API first, fall back to demo data
  if (useBackendAPI) {
    try {
      const filters = {};
      const fYear = document.getElementById("fYear").value;
      const fType = document.getElementById("fType").value;
      if (fYear) filters.year_range = fYear;
      if (fType) filters.case_type = fType;

      const topK = parseInt(document.getElementById("fTop").value) || 10;

      let p = 0;
      const iv = setInterval(() => { p = Math.min(p + Math.random() * 15, 88); fill.style.width = p + "%"; }, 100);

      const data = await API.search(v, filters, topK);
      clearInterval(iv); fill.style.width = "100%";

      setTimeout(() => {
        prog.style.display = "none"; fill.style.width = "0";
        btn.disabled = false;
        document.getElementById("skelContainer").style.display = "none";
        document.getElementById("resTopBar").style.display = "flex";

        const n = data.results.length;
        const elapsed = data.meta.time_seconds;
        document.getElementById("resMetaText").innerHTML = `Showing <strong>${n}</strong> similar cases &nbsp;·&nbsp; <span style="font-family:var(--mono);font-size:12px;color:var(--teal)">${elapsed}s</span>`;

        // Convert API results to CASES-compatible format and render
        data.results.forEach((r, i) => renderAPIResult(r, i));
        showToast("✅", "Search complete", n + " legal precedents found");
      }, 180);

      return;
    } catch (err) {
      console.warn("Backend unavailable, using demo data:", err.message);
    }
  }

  // Demo mode fallback
  let p = 0;
  const iv = setInterval(() => { p = Math.min(p + Math.random() * 9, 88); fill.style.width = p + "%"; }, 100);
  setTimeout(() => {
    clearInterval(iv); fill.style.width = "100%";
    setTimeout(() => {
      prog.style.display = "none"; fill.style.width = "0";
      btn.disabled = false;
      document.getElementById("skelContainer").style.display = "none";
      document.getElementById("resTopBar").style.display = "flex";
      const n = CASES.length;
      document.getElementById("resMetaText").innerHTML = `Showing <strong>${n}</strong> similar cases &nbsp;·&nbsp; <span style="font-family:var(--mono);font-size:12px;color:var(--teal)">0.34s</span>`;
      currentResults = [...CASES];
      CASES.forEach((c, i) => renderResult(c, i));
      showToast("✅", "Search complete", n + " legal precedents found");
    }, 180);
  }, 2000);
}

/* ══ RENDER RESULT CARD ═══════════════════════════ */
function renderResult(c, i) {
  const list = document.getElementById("resultsList");
  const pct = Math.round(c.score * 100);
  const sc = c.score > .85 ? "sc-h" : c.score > .70 ? "sc-m" : "sc-l";
  const accentColor = c.score > .85 ? `background:linear-gradient(90deg,var(--teal),#2a9d8f)` : c.score > .70 ? `background:linear-gradient(90deg,var(--gold),var(--gold2))` : `background:linear-gradient(90deg,var(--crimson),#c0392b)`;
  const isSaved = savedCases.some(s => s.id === c.id);
  const isSelected = compareCases.some(x => x === c.id);

  const div = document.createElement("div");
  div.className = "result-card" + (isSelected ? " compare-selected" : "");
  div.dataset.id = c.id;
  div.style.animationDelay = i * .07 + "s";

  div.innerHTML = `
    <div class="rc-accent-bar" style="${accentColor}"></div>
    <div class="rc-main">
      <div class="rc-header">
        <div class="rc-score-ring ${sc}">
          <span>${pct}</span><span class="sc-sub">%</span>
        </div>
        <div class="rc-info">
          <div class="rc-title" onclick="openModal(${c.id})">${c.title}</div>
          <div class="rc-pills">
            <span class="pill p-cit">${c.cit}</span>
            <span class="pill p-yr">${c.year}</span>
            <span class="pill p-tp">${c.type}</span>
            <span class="pill p-jg">${c.author.split(" ").slice(-2).join(" ")} J.</span>
          </div>
          <div class="rc-snippet">${c.snippet}</div>
        </div>
      </div>
    </div>
    <div class="rc-footer">
      <div class="acts-row">
        ${c.acts.map(a => `<span class="act">${a}</span>`).join("")}
      </div>
      <div class="card-actions">
        ${compareMode ? `<button class="card-btn ${isSelected ? "primary" : ""}" onclick="toggleCompareCase(${c.id},this)">${isSelected ? "✓ Selected" : "+ Compare"}</button>` : ""}
        <button class="card-btn primary" onclick="openModal(${c.id})">View</button>
        <button class="card-btn" onclick="toggleExpand(this,${c.id})">Details ↓</button>
        <button class="card-btn ${isSaved ? "save-on" : ""}" id="savebtn-${c.id}" onclick="toggleSaveCase(${c.id},this)">${isSaved ? "🔖 Saved" : "🔖 Save"}</button>
        <button class="card-btn" onclick="copyCit('${c.cit}')">Copy</button>
      </div>
    </div>
    <div class="rc-details" id="details-${c.id}">
      <div class="detail-grid">
        <div class="d-block">
          <div class="d-head">Case Details</div>
          <div class="d-row"><span class="d-k">Petitioner</span><span class="d-v">${c.pet}</span></div>
          <div class="d-row"><span class="d-k">Respondent</span><span class="d-v">${c.res}</span></div>
          <div class="d-row"><span class="d-k">Bench Size</span><span class="d-v">${c.bench} Judges</span></div>
          <div class="d-row"><span class="d-k">Disposal</span><span class="d-v">${c.disp}</span></div>
          <div class="d-row"><span class="d-k">Author</span><span class="d-v">${c.author}</span></div>
        </div>
        <div class="d-block">
          <div class="d-head">Relevance Breakdown</div>
          <div class="srow"><div class="slabel"><span>Text Relevance</span><span style="color:var(--gold)">${Math.round(c.tfidf*100)}%</span></div><div class="strack"><div class="sfill sf1" style="width:0" data-w="${Math.round(c.tfidf*100)}%"></div></div></div>
          <div class="srow"><div class="slabel"><span>Context Understanding</span><span style="color:var(--teal)">${Math.round(c.bert*100)}%</span></div><div class="strack"><div class="sfill sf2" style="width:0" data-w="${Math.round(c.bert*100)}%"></div></div></div>
          <div class="srow"><div class="slabel"><span>Citation Relevance</span><span style="color:#6366f1">${Math.round(c.graph*100)}%</span></div><div class="strack"><div class="sfill sf3" style="width:0" data-w="${Math.round(c.graph*100)}%"></div></div></div>
        </div>
      </div>
      <div class="seg-block">
        <div class="seg-h">Matching Segments</div>
        ${c.segs.map(s => `<div class="seg">${s}</div>`).join("")}
      </div>
    </div>`;
  list.appendChild(div);
}

function renderAPIResult(r, i) {
  // Adapt API response to the same format used by renderResult
  const c = {
    id: r.id, title: r.title, pet: r.petitioner, res: r.respondent,
    year: r.year, cit: r.citation, disp: r.disposal, bench: r.bench_size,
    judge: r.judges, author: r.author, type: r.case_type,
    score: r.score,
    tfidf: r.relevance?.text_relevance || r.score * 0.9,
    bert: r.relevance?.context_understanding || r.score * 0.95,
    graph: r.relevance?.citation_relevance || r.score * 0.85,
    snippet: r.snippet, segs: r.segments || [], acts: r.acts || [],
  };
  renderResult(c, i);
}

/* ══ EXPAND / SORT ════════════════════════════════ */
function toggleExpand(btn, id) {
  const card = btn.closest(".result-card");
  card.classList.toggle("expanded");
  const open = card.classList.contains("expanded");
  btn.textContent = open ? "Collapse ↑" : "Details ↓";
  btn.classList.toggle("primary", open);
  if (open) {
    setTimeout(() => {
      card.querySelectorAll(".sfill").forEach(f => { f.style.width = f.dataset.w; });
    }, 40);
  }
}

function sortResults(val) {
  const list = document.getElementById("resultsList");
  const cards = [...list.querySelectorAll(".result-card")];
  cards.sort((a, b) => {
    const ca = CASES.find(c => c.id === +a.dataset.id);
    const cb = CASES.find(c => c.id === +b.dataset.id);
    if (!ca || !cb) return 0;
    if (val === "score") return cb.score - ca.score;
    if (val === "year-d") return cb.year - ca.year;
    if (val === "year-a") return ca.year - cb.year;
  });
  cards.forEach(c => list.appendChild(c));
}

/* ══ SAVE CASES ═══════════════════════════════════ */
function toggleSaveCase(id, btn) {
  const c = CASES.find(x => x.id === id);
  const idx = savedCases.findIndex(s => s.id === id);
  if (idx === -1) {
    savedCases.push(c);
    btn.textContent = "🔖 Saved"; btn.classList.add("save-on");
    showToast("🔖", "Saved!", c.title.split("v.")[0].trim());
  } else {
    savedCases.splice(idx, 1);
    btn.textContent = "🔖 Save"; btn.classList.remove("save-on");
    showToast("", "Removed", "Case removed from saved");
  }
  updateSavedUI();
}

function updateSavedUI() {
  const n = savedCases.length;
  document.getElementById("savedCountText").textContent = n + " saved";
  document.getElementById("viewSavedBtn").style.display = n > 0 ? "inline-block" : "none";
  renderSavedList();
}

function renderSavedList() {
  const list = document.getElementById("savedList");
  list.innerHTML = savedCases.length === 0
    ? '<div style="color:var(--quiet);font-size:13px;text-align:center;padding:16px">No saved cases yet</div>'
    : savedCases.map(c => `
        <div class="saved-item">
          <div>
            <div class="saved-item-name">${c.title}</div>
            <div class="saved-item-meta">${c.cit} · ${Math.round(c.score*100)}% match</div>
          </div>
          <button class="unsave-btn" onclick="removeSaved(${c.id})">✕</button>
        </div>`).join("");
}

function removeSaved(id) {
  savedCases = savedCases.filter(c => c.id !== id);
  const btn = document.getElementById("savebtn-" + id);
  if (btn) { btn.textContent = "🔖 Save"; btn.classList.remove("save-on"); }
  updateSavedUI();
}

function clearSaved() { savedCases = []; updateSavedUI(); showToast("🗑", "Cleared", "All saved cases removed"); }

function toggleSaved() {
  const panel = document.getElementById("savedPanel");
  panel.classList.toggle("show");
  renderSavedList();
}

/* ══ COMPARE MODE ═════════════════════════════════ */
function toggleCompareMode() {
  compareMode = !compareMode;
  const btn = document.getElementById("compareToggleBtn");
  btn.classList.toggle("active", compareMode);
  btn.textContent = compareMode ? "⚖ Exit Compare" : "⚖ Compare";
  compareCases = [];
  document.getElementById("comparePanel").classList.remove("show");
  reRenderResults();
  if (compareMode) showToast("⚖", "Compare mode", "Select 2 cases to compare side by side");
}

function toggleCompareCase(id, btn) {
  const idx = compareCases.indexOf(id);
  if (idx !== -1) {
    compareCases.splice(idx, 1);
    btn.textContent = "+ Compare"; btn.classList.remove("primary");
    const card = document.querySelector(`.result-card[data-id="${id}"]`);
    if (card) card.classList.remove("compare-selected");
  } else {
    if (compareCases.length >= 2) { showToast("⚠", "Max 2", "You can only compare 2 cases at a time"); return; }
    compareCases.push(id);
    btn.textContent = "✓ Selected"; btn.classList.add("primary");
    const card = document.querySelector(`.result-card[data-id="${id}"]`);
    if (card) card.classList.add("compare-selected");
  }
  if (compareCases.length === 2) renderComparison();
}

function renderComparison() {
  const panel = document.getElementById("comparePanel");
  const grid = document.getElementById("compareGrid");
  panel.classList.add("show");
  const cases = compareCases.map(id => CASES.find(c => c.id === id));
  grid.innerHTML = cases.map(c => `
    <div class="cp-case">
      <div class="cp-case-title">${c.title}</div>
      <div class="cp-row"><span class="cp-row-k">Year</span><span class="cp-row-v">${c.year}</span></div>
      <div class="cp-row"><span class="cp-row-k">Citation</span><span class="cp-row-v" style="font-family:var(--mono);font-size:11px">${c.cit}</span></div>
      <div class="cp-row"><span class="cp-row-k">Type</span><span class="cp-row-v">${c.type}</span></div>
      <div class="cp-row"><span class="cp-row-k">Bench</span><span class="cp-row-v">${c.bench} judges</span></div>
      <div class="cp-row"><span class="cp-row-k">Author</span><span class="cp-row-v">${c.author}</span></div>
      <div class="cp-row"><span class="cp-row-k">Disposal</span><span class="cp-row-v">${c.disp}</span></div>
      <div class="cp-row"><span class="cp-row-k">Similarity</span><span class="cp-row-v" style="color:var(--gold)">${Math.round(c.score*100)}%</span></div>
      <div class="cp-row"><span class="cp-row-k">Text Relevance</span><span class="cp-row-v">${Math.round(c.tfidf*100)}%</span></div>
      <div class="cp-row"><span class="cp-row-k">Context Match</span><span class="cp-row-v">${Math.round(c.bert*100)}%</span></div>
    </div>`).join("");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeCompare() {
  document.getElementById("comparePanel").classList.remove("show");
  compareCases = [];
  compareMode = false;
  document.getElementById("compareToggleBtn").classList.remove("active");
  document.getElementById("compareToggleBtn").textContent = "⚖ Compare";
  reRenderResults();
}

function reRenderResults() {
  const list = document.getElementById("resultsList");
  if (!list.innerHTML) return;
  list.innerHTML = "";
  CASES.forEach((c, i) => renderResult(c, i));
}
