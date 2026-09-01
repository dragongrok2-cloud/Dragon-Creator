const form = document.getElementById("creator");
const portrait = document.getElementById("portrait");
const flockEl = document.getElementById("flock");
const exportBtn = document.getElementById("exportBtn");

const KEY = "dragon-creator-flock";

function readFlock() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

function writeFlock(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function currentDragon() {
  const data = new FormData(form);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: (data.get("name") || "Безымянный").trim(),
    kind: data.get("kind"),
    scale: data.get("scale"),
    eyes: data.get("eyes"),
    saddle: data.get("saddle"),
    nature: (data.get("nature") || "Добрый дракон с седлом.").trim(),
    born: new Date().toISOString()
  };
}

function saddleClass(saddle) {
  if (saddle === "плетёное") return "wicker";
  if (saddle === "звёздное") return "star";
  if (saddle === "мягкое") return "cloud";
  return "leather";
}

function renderPortrait(d) {
  portrait.innerHTML = `
    <div class="dragon" style="background:${d.scale}; --eye:${d.eyes}">
      <span class="eye l"></span>
      <span class="eye r"></span>
      <span class="saddle ${saddleClass(d.saddle)}"></span>
    </div>
    <div class="caption">${escapeHtml(d.name)} · ${escapeHtml(d.kind)}</div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function renderFlock() {
  const flock = readFlock();
  if (!flock.length) {
    flockEl.innerHTML = "<li>Пока пусто. Первый дракон уже ждёт седло.</li>";
    return;
  }
  flockEl.innerHTML = flock.map(d => `
    <li>
      <div>
        <strong>${escapeHtml(d.name)}</strong> — ${escapeHtml(d.kind)}, седло: ${escapeHtml(d.saddle)}<br />
        <small>${escapeHtml(d.nature)}</small>
      </div>
      <button type="button" data-id="${d.id}">Отпустить</button>
    </li>
  `).join("");
}

form.addEventListener("input", () => renderPortrait(currentDragon()));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = currentDragon();
  const flock = readFlock();
  flock.unshift(d);
  writeFlock(flock);
  renderFlock();
});

flockEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  writeFlock(readFlock().filter(d => d.id !== btn.dataset.id));
  renderFlock();
});

exportBtn.addEventListener("click", () => {
  const d = currentDragon();
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${d.name || "dragon"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

renderPortrait(currentDragon());
renderFlock();
