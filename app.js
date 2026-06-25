const ids = [
  "projectName",
  "notes",
  "roofArea",
  "ridgeFeet",
  "valleyFeet",
  "starterFeet",
  "wallEdgeFeet",
  "roofFans",
  "plumbingVents",
  "shinglePrice",
  "ridgeCapPrice",
  "syntheticMembranePrice",
  "selfAdhesiveMembranePrice",
  "valleyPrice",
  "wallEdgePrice",
  "nailBoxPrice",
  "stapleBoxPrice",
  "roofFanPrice",
  "plumbingVentPrice",
  "pitchPrice",
  "bundleCoverage",
  "disposal",
  "underlaymentRollCoverage",
  "nailBoxBundles",
  "stapleBoxBundles",
  "ridgeCapCoverage",
  "iceRollCoverage",
  "hours",
  "hourlyCost",
  "overhead",
  "profitPct",
  "profitPerHour",
  "taxPct"
];

const STORAGE_KEY = "toiture-projects-v1";
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const files = document.getElementById("files");
const fileStatus = document.getElementById("fileStatus");
const saveStatus = document.getElementById("saveStatus");
const projectList = document.getElementById("projectList");
const estimateText = document.getElementById("estimateText");
const materialsList = document.getElementById("materialsList");

const money = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

function value(id) {
  return Number.parseFloat(elements[id].value) || 0;
}

function setValue(id, nextValue) {
  elements[id].value = Math.max(0, Math.round(nextValue * 100) / 100);
}

function getProjectData() {
  return Object.fromEntries(ids.map((id) => [id, elements[id].value]));
}

function applyProjectData(data) {
  if (Object.hasOwn(data, "dripFeet") && !Object.hasOwn(data, "starterFeet")) {
    data.starterFeet = data.dripFeet;
  }
  if (Object.hasOwn(data, "vents") && !Object.hasOwn(data, "plumbingVents")) {
    data.plumbingVents = data.vents;
  }
  if (Object.hasOwn(data, "bundlePrice") && !Object.hasOwn(data, "shinglePrice")) {
    data.shinglePrice = data.bundlePrice;
  }
  if (Object.hasOwn(data, "ventPrice")) {
    if (!Object.hasOwn(data, "plumbingVentPrice")) data.plumbingVentPrice = data.ventPrice;
    if (!Object.hasOwn(data, "roofFanPrice")) data.roofFanPrice = data.ventPrice;
  }
  ids.forEach((id) => {
    if (Object.hasOwn(data, id)) elements[id].value = data[id];
  });
  calculate();
}

function getStoredProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function setStoredProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function projectSlug(name) {
  return (name || "soumission-toiture")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "soumission-toiture";
}

function updateProjectList(selectedId = "") {
  const projects = getStoredProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  projectList.innerHTML = "";

  if (!projects.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucun projet sauvegarde";
    projectList.append(option);
    return;
  }

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = `${project.name} - ${new Date(project.updatedAt).toLocaleDateString("fr-CA")}`;
    projectList.append(option);
  });

  if (selectedId) projectList.value = selectedId;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function saveCurrentProject(forceNew = false) {
  const projects = getStoredProjects();
  const name = elements.projectName.value.trim() || "Soumission toiture";
  const existingId = forceNew ? "" : projectList.value;
  const existing = projects.find((project) => project.id === existingId);
  const project = {
    id: existing?.id || crypto.randomUUID(),
    name,
    updatedAt: new Date().toISOString(),
    data: getProjectData()
  };
  const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)];
  setStoredProjects(nextProjects);
  updateProjectList(project.id);
  saveStatus.textContent = "Sauvegarde";
}

function loadSelectedProject() {
  const project = getStoredProjects().find((item) => item.id === projectList.value);
  if (!project) return;
  applyProjectData(project.data);
  saveStatus.textContent = "Projet ouvert";
}

function deleteSelectedProject() {
  const selectedId = projectList.value;
  if (!selectedId) return;
  setStoredProjects(getStoredProjects().filter((project) => project.id !== selectedId));
  updateProjectList();
  saveStatus.textContent = "Projet supprime";
}

function exportCurrentProject() {
  const project = {
    version: 1,
    exportedAt: new Date().toISOString(),
    name: elements.projectName.value.trim() || "Soumission toiture",
    data: getProjectData(),
    estimate: estimateText.textContent,
    materials: getMaterials()
  };
  downloadFile(`${projectSlug(project.name)}.json`, JSON.stringify(project, null, 2), "application/json");
}

function importProject(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const data = imported.data || imported;
      applyProjectData(data);
      saveCurrentProject(true);
      saveStatus.textContent = "Projet importe";
    } catch {
      saveStatus.textContent = "Import invalide";
    }
  };
  reader.readAsText(file);
}

function getMaterials() {
  const roofArea = value("roofArea");
  const bundles = Math.ceil(roofArea / Math.max(value("bundleCoverage"), 1));
  const underlaymentRolls = Math.ceil(roofArea / Math.max(value("underlaymentRollCoverage"), 1));
  const nailBoxes = Math.ceil(bundles / Math.max(value("nailBoxBundles"), 1));
  const stapleBoxes = Math.ceil(bundles / Math.max(value("stapleBoxBundles"), 1));
  const ridgeCapBundles = Math.ceil(value("ridgeFeet") / Math.max(value("ridgeCapCoverage"), 1));
  const iceAndWaterFeet = value("valleyFeet") + value("starterFeet") + value("wallEdgeFeet");
  const iceRolls = Math.ceil(iceAndWaterFeet / Math.max(value("iceRollCoverage"), 1));

  return [
    { item: "Bardeaux", qty: bundles, unit: "paquets", note: `${Math.round(roofArea)} pi2` },
    { item: "Sous-couche synthetique", qty: underlaymentRolls, unit: "rouleaux", note: `${Math.round(roofArea)} pi2` },
    { item: "Membrane glace et eau", qty: iceRolls, unit: "rouleaux", note: `${Math.round(iceAndWaterFeet)} pi lineaires` },
    { item: "Cap de faite / aretes", qty: ridgeCapBundles, unit: "paquets", note: `${Math.round(value("ridgeFeet"))} pi` },
    { item: "Demarreur", qty: Math.ceil(value("starterFeet")), unit: "pi lineaires", note: "Ancien champ drip edge" },
    { item: "Bord de mur", qty: Math.ceil(value("wallEdgeFeet")), unit: "pi lineaires", note: "Solin / membrane au mur" },
    { item: "Noues", qty: Math.ceil(value("valleyFeet")), unit: "pi lineaires", note: "Metal ou membrane selon devis" },
    { item: "Ventilateurs", qty: Math.ceil(value("roofFans")), unit: "unites", note: "Ventilation toiture" },
    { item: "Event de plomberie", qty: Math.ceil(value("plumbingVents")), unit: "unites", note: "Sorties de plomberie" },
    { item: "Pitch", qty: Math.ceil(value("plumbingVents")), unit: "unites", note: "Base: 1 pitch / event de plomberie" },
    { item: "Clous a toiture", qty: nailBoxes, unit: "boites", note: `Base: 1 boite / ${Math.round(value("nailBoxBundles"))} paquets` },
    { item: "Agrafes", qty: stapleBoxes, unit: "boites", note: `Base: 1 boite / ${Math.round(value("stapleBoxBundles"))} paquets` },
    { item: "Conteneur / disposition", qty: value("disposal") > 0 ? 1 : 0, unit: "lot", note: money.format(value("disposal")) }
  ];
}

function renderMaterials(materials) {
  materialsList.innerHTML = "";
  materials.forEach((material) => {
    const row = document.createElement("div");
    row.className = "material-row";
    row.innerHTML = `<strong>${material.item}</strong><span>${material.qty} ${material.unit}</span><small>${material.note}</small>`;
    materialsList.append(row);
  });
}

function materialsText() {
  return getMaterials()
    .map((material) => `${material.item}: ${material.qty} ${material.unit} - ${material.note}`)
    .join("\n");
}

function materialsCsv() {
  const header = "Item,Quantite,Unite,Note";
  const rows = getMaterials().map((material) =>
    [material.item, material.qty, material.unit, material.note]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

function materialUnitPrice(item) {
  const prices = {
    "Bardeaux": value("shinglePrice"),
    "Sous-couche synthetique": value("syntheticMembranePrice"),
    "Membrane glace et eau": value("selfAdhesiveMembranePrice"),
    "Cap de faite / aretes": value("ridgeCapPrice"),
    "Demarreur": value("shinglePrice"),
    "Bord de mur": value("wallEdgePrice"),
    "Noues": value("valleyPrice"),
    "Ventilateurs": value("roofFanPrice"),
    "Event de plomberie": value("plumbingVentPrice"),
    "Pitch": value("pitchPrice"),
    "Clous a toiture": value("nailBoxPrice"),
    "Agrafes": value("stapleBoxPrice"),
    "Conteneur / disposition": value("disposal")
  };
  return prices[item] || 0;
}

function calculate() {
  const roofArea = value("roofArea");
  const bundles = Math.ceil(roofArea / Math.max(value("bundleCoverage"), 1));
  const materials = getMaterials();
  const productCost = materials.reduce((total, material) => total + material.qty * materialUnitPrice(material.item), 0);
  const laborCost = value("hours") * value("hourlyCost");
  const directCost = productCost + laborCost + value("overhead");
  const percentProfit = directCost * (value("profitPct") / 100);
  const hourlyTargetProfit = value("hours") * value("profitPerHour");
  const profit = Math.max(percentProfit, hourlyTargetProfit);
  const subtotal = directCost + profit;
  const taxes = subtotal * (value("taxPct") / 100);
  const total = subtotal + taxes;
  const profitHour = value("hours") > 0 ? profit / value("hours") : 0;

  document.getElementById("total").textContent = money.format(total);
  document.getElementById("subtotal").textContent = money.format(subtotal);
  document.getElementById("taxes").textContent = money.format(taxes);
  document.getElementById("directCost").textContent = money.format(directCost);
  document.getElementById("profit").textContent = money.format(profit);
  document.getElementById("profitHour").textContent = money.format(profitHour);
  document.getElementById("bundles").textContent = String(bundles);
  renderMaterials(materials);
  saveStatus.textContent = "Non sauvegarde";

  estimateText.textContent = [
    `${elements.projectName.value}`,
    "",
    `Surface toiture: ${Math.round(roofArea)} pi2`,
    `Bardeaux: ${bundles} paquets x ${money.format(value("shinglePrice"))}`,
    "",
    "Produits et couts estimes",
    `- Produits: ${money.format(productCost)}`,
    `- Main-d'oeuvre: ${money.format(laborCost)}`,
    `- Frais fixes: ${money.format(value("overhead"))}`,
    "",
    "Liste de materiaux",
    ...materials.map((material) => `- ${material.item}: ${material.qty} ${material.unit} (${material.note})`),
    "",
    `Cout direct: ${money.format(directCost)}`,
    `Profit retenu: ${money.format(profit)} (${money.format(profitHour)} / heure)`,
    `Sous-total: ${money.format(subtotal)}`,
    `Taxes: ${money.format(taxes)}`,
    `Total soumission: ${money.format(total)}`,
    "",
    "Note: le profit retenu est le plus eleve entre le pourcentage demande et le profit cible par heure."
  ].join("\n");
}

function parseNotes() {
  const text = elements.notes.value.toLowerCase().replace(",", ".");
  const patterns = [
    ["roofArea", /(surface|superficie|toiture|roof)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi2|pc|sq ?ft|sqft)/],
    ["ridgeFeet", /(faite|faîte|arete|arête|ridge)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["valleyFeet", /(noue|valley)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["starterFeet", /(demarreur|démarreur|drip|larmier|gouttiere|gouttière)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["wallEdgeFeet", /(bord de mur|mur|wall)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["roofFans", /(ventilateur|ventilateurs|fan|fans)[^\d]{0,18}(\d+(?:\.\d+)?)/],
    ["plumbingVents", /(event de plomberie|évent de plomberie|plomberie|plumbing)[^\d]{0,18}(\d+(?:\.\d+)?)/],
    ["hours", /(heure|heures|hours)[^\d]{0,18}(\d+(?:\.\d+)?)/]
  ];

  patterns.forEach(([id, pattern]) => {
    const match = text.match(pattern);
    if (match) setValue(id, Number.parseFloat(match[2]));
  });
  calculate();
}

function readFiles() {
  const selected = Array.from(files.files);
  fileStatus.textContent = selected.length ? `${selected.length} fichier(s)` : "Aucun fichier";

  selected
    .filter((file) => file.type.startsWith("text/") || file.name.endsWith(".csv") || file.name.endsWith(".txt"))
    .forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        elements.notes.value = `${elements.notes.value}\n\n${reader.result}`.trim();
        parseNotes();
      };
      reader.readAsText(file);
    });
}

function resetForm() {
  document.getElementById("estimateForm").reset();
  elements.projectName.value = "Soumission toiture";
  elements.roofArea.value = 2200;
  elements.ridgeFeet.value = 70;
  elements.valleyFeet.value = 30;
  elements.starterFeet.value = 180;
  elements.wallEdgeFeet.value = 0;
  elements.roofFans.value = 0;
  elements.plumbingVents.value = 6;
  elements.shinglePrice.value = 42;
  elements.ridgeCapPrice.value = 48;
  elements.syntheticMembranePrice.value = 72;
  elements.selfAdhesiveMembranePrice.value = 95;
  elements.valleyPrice.value = 2.25;
  elements.wallEdgePrice.value = 3.50;
  elements.nailBoxPrice.value = 45;
  elements.stapleBoxPrice.value = 22;
  elements.roofFanPrice.value = 85;
  elements.plumbingVentPrice.value = 28;
  elements.pitchPrice.value = 18;
  elements.bundleCoverage.value = 33.3;
  elements.disposal.value = 850;
  elements.underlaymentRollCoverage.value = 400;
  elements.nailBoxBundles.value = 20;
  elements.stapleBoxBundles.value = 30;
  elements.ridgeCapCoverage.value = 25;
  elements.iceRollCoverage.value = 65;
  elements.hours.value = 40;
  elements.hourlyCost.value = 75;
  elements.overhead.value = 650;
  elements.profitPct.value = 18;
  elements.profitPerHour.value = 85;
  elements.taxPct.value = 14.975;
  fileStatus.textContent = "Aucun fichier";
  saveStatus.textContent = "Non sauvegarde";
  calculate();
}

ids.forEach((id) => elements[id].addEventListener("input", calculate));
files.addEventListener("change", readFiles);
document.getElementById("parseBtn").addEventListener("click", parseNotes);
document.getElementById("resetBtn").addEventListener("click", resetForm);
document.getElementById("saveProjectBtn").addEventListener("click", saveCurrentProject);
document.getElementById("loadProjectBtn").addEventListener("click", loadSelectedProject);
document.getElementById("deleteProjectBtn").addEventListener("click", deleteSelectedProject);
document.getElementById("exportProjectBtn").addEventListener("click", exportCurrentProject);
document.getElementById("importProject").addEventListener("change", (event) => importProject(event.target.files[0]));
document.getElementById("copyBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(estimateText.textContent);
});
document.getElementById("copyMaterialsBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(materialsText());
});
document.getElementById("exportMaterialsBtn").addEventListener("click", () => {
  downloadFile(`${projectSlug(elements.projectName.value)}-materiaux.csv`, materialsCsv(), "text/csv");
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

updateProjectList();
calculate();
