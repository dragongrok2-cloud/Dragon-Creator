const form = document.getElementById("creator");
const portrait = document.getElementById("portrait");
const flockEl = document.getElementById("flock");
const exportBtn = document.getElementById("exportBtn");
const flyBtn = document.getElementById("flyBtn");
const landBtn = document.getElementById("landBtn");
const skyMap = document.getElementById("skyMap");
const skyField = document.getElementById("skyField");
const flightLog = document.getElementById("flightLog");
const importFile = document.getElementById("importFile");
const samplesBtn = document.getElementById("samplesBtn");

const KEY = "dragon-creator-flock";

const LANDMARKS = [
  "утреннее солнце над хребтом",
  "тихое озеро в облаках",
  "рощу, где пахнет хвоей",
  "речную петлю с серебряной водой",
  "звёздный перевал",
  "тёплый ветер над поляной",
  "маяк из старого фонарика",
  "весеннюю поляну с первыми цветами"
];

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
    name: (data.get("name") || "Безымянный").trim() || "Безымянный",
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
  if (saddle === "мягкое" || saddle === "облачное") return "cloud";
  return "leather";
}

function kindClass(kind) {
  if (kind === "лесной") return "forest";
  if (kind === "речной") return "river";
  if (kind === "звёздный") return "starry";
  return "warm";
}

function renderPortrait(d, flying) {
  portrait.classList.toggle("flying", !!flying);
  portrait.innerHTML = `
    <div class="dragon ${kindClass(d.kind)}" style="background:${d.scale}; --eye:${d.eyes}">
      <span class="horn l"></span>
      <span class="horn r"></span>
      <span class="wing l"></span>
      <span class="wing r"></span>
      <span class="eye l"></span>
      <span class="eye r"></span>
      <span class="saddle ${saddleClass(d.saddle)}"></span>
      <span class="tail"></span>
    </div>
    <div class="caption">${escapeHtml(d.name)} · ${escapeHtml(d.kind)}</div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&","<":"<",">":">",'"':""","'":"&#39;"
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
      <div class="row-actions">
        <button type="button" data-saddle="${d.id}">Сесть</button>
        <button type="button" data-id="${d.id}">Отпустить</button>
      </div>
    </li>
  `).join("");
}

function adoptDragon(d) {
  const flock = readFlock();
  if (!d.id) d.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  if (!d.born) d.born = new Date().toISOString();
  flock.unshift(d);
  writeFlock(flock);
  renderFlock();
}

function fillForm(d) {
  form.name.value = d.name || "";
  form.kind.value = d.kind || "тёплый";
  form.scale.value = d.scale || "#c45c26";
  form.eyes.value = d.eyes || "#f4e27a";
  form.saddle.value = d.saddle || "кожаное";
  form.nature.value = d.nature || "";
  renderPortrait(currentDragon());
}

function takeFlight(d) {
  skyMap.hidden = false;
  renderPortrait(d, true);
  const spots = LANDMARKS.sort(() => Math.random() - 0.5).slice(0, 3);
  flightLog.textContent = `${d.name} несёт всадника мягко: мимо ${spots.join(", затем ")}. Седло ${d.saddle} держит тепло.`;
  skyField.innerHTML = spots.map((name, i) =>
    `<span class="cloud" style="--i:${i}">${escapeHtml(name)}</span>`
  ).join("") + `<span class="flyer" style="background:${d.scale}"></span>`;
  skyMap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("input", () => renderPortrait(currentDragon()));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = currentDragon();
  adoptDragon(d);
});

flockEl.addEventListener("click", (e) => {
  const leave = e.target.closest("button[data-id]");
  if (leave) {
    writeFlock(readFlock().filter(d => d.id !== leave.dataset.id));
    renderFlock();
    return;
  }
  const ride = e.target.closest("button[data-saddle]");
  if (ride) {
    const d = readFlock().find(x => x.id === ride.dataset.saddle);
    if (d) {
      fillForm(d);
      takeFlight(d);
    }
  }
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

flyBtn.addEventListener("click", () => takeFlight(currentDragon()));
landBtn.addEventListener("click", () => {
  skyMap.hidden = true;
  renderPortrait(currentDragon());
});

importFile.addEventListener("change", async () => {
  const file = importFile.files && importFile.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const list = Array.isArray(parsed) ? parsed : [parsed];
    list.forEach(adoptDragon);
  } catch {
    alert("Этот свиток не читается. Нужен JSON дракона или стаи.");
  }
  importFile.value = "";
});

samplesBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("sample-dragons.json");
    const list = await res.json();
    list.forEach(adoptDragon);
    if (list[0]) fillForm(list[0]);
  } catch {
    alert("Примеры не долетели. Открой логово через локальный сервер или положи sample-dragons.json рядом.");
  }
});

renderPortrait(currentDragon());
renderFlock();
