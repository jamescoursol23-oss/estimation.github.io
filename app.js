const ids = [
  "projectName",
  "notes",
  "roofArea",
  "wastePct",
  "ridgeFeet",
  "valleyFeet",
  "dripFeet",
  "vents",
  "bundlePrice",
  "bundleCoverage",
  "underlaymentRate",
  "accessoryRate",
  "ventPrice",
  "disposal",
  "hours",
  "hourlyCost",
  "overhead",
  "profitPct",
  "profitPerHour",
  "taxPct"
];

const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const files = document.getElementById("files");
const fileStatus = document.getElementById("fileStatus");
const estimateText = document.getElementById("estimateText");

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

function calculate() {
  const roofArea = value("roofArea");
  const wastePct = value("wastePct");
  const billableArea = roofArea * (1 + wastePct / 100);
  const bundles = Math.ceil(billableArea / Math.max(value("bundleCoverage"), 1));
  const shingleCost = bundles * value("bundlePrice");
  const underlaymentCost = billableArea * value("underlaymentRate");
  const accessoryFeet = value("ridgeFeet") + value("valleyFeet") + value("dripFeet");
  const accessoryCost = accessoryFeet * value("accessoryRate");
  const ventCost = value("vents") * value("ventPrice");
  const laborCost = value("hours") * value("hourlyCost");
  const directCost = shingleCost + underlaymentCost + accessoryCost + ventCost + value("disposal") + laborCost + value("overhead");
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

  estimateText.textContent = [
    `${elements.projectName.value}`,
    "",
    `Surface toiture: ${Math.round(roofArea)} pi2`,
    `Surface avec pertes (${wastePct}%): ${Math.round(billableArea)} pi2`,
    `Bardeaux: ${bundles} paquets x ${money.format(value("bundlePrice"))}`,
    "",
    "Coûts estimés",
    `- Bardeaux: ${money.format(shingleCost)}`,
    `- Sous-couche: ${money.format(underlaymentCost)}`,
    `- Accessoires: ${money.format(accessoryCost)}`,
    `- Évents: ${money.format(ventCost)}`,
    `- Conteneur/disposition: ${money.format(value("disposal"))}`,
    `- Main-d’œuvre: ${money.format(laborCost)}`,
    `- Frais fixes: ${money.format(value("overhead"))}`,
    "",
    `Coût direct: ${money.format(directCost)}`,
    `Profit retenu: ${money.format(profit)} (${money.format(profitHour)} / heure)`,
    `Sous-total: ${money.format(subtotal)}`,
    `Taxes: ${money.format(taxes)}`,
    `Total soumission: ${money.format(total)}`,
    "",
    "Note: le profit retenu est le plus élevé entre le pourcentage demandé et le profit cible par heure."
  ].join("\n");
}

function parseNotes() {
  const text = elements.notes.value.toLowerCase().replace(",", ".");
  const patterns = [
    ["roofArea", /(surface|superficie|toiture|roof)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi2|pc|sq ?ft|sqft)/],
    ["wastePct", /(perte|waste)[^\d]{0,18}(\d+(?:\.\d+)?)\s*%/],
    ["ridgeFeet", /(fa[iî]te|ar[eê]te|ridge)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["valleyFeet", /(noue|valley)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["dripFeet", /(drip|larmier|goutti[eè]re)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(pi|ft|pied)/],
    ["vents", /([ée]vent|ventilation|vent)[^\d]{0,18}(\d+(?:\.\d+)?)/],
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
  elements.wastePct.value = 12;
  elements.ridgeFeet.value = 70;
  elements.valleyFeet.value = 30;
  elements.dripFeet.value = 180;
  elements.vents.value = 6;
  elements.bundlePrice.value = 42;
  elements.bundleCoverage.value = 33.3;
  elements.underlaymentRate.value = 0.18;
  elements.accessoryRate.value = 2.25;
  elements.ventPrice.value = 28;
  elements.disposal.value = 850;
  elements.hours.value = 40;
  elements.hourlyCost.value = 75;
  elements.overhead.value = 650;
  elements.profitPct.value = 18;
  elements.profitPerHour.value = 85;
  elements.taxPct.value = 14.975;
  fileStatus.textContent = "Aucun fichier";
  calculate();
}

ids.forEach((id) => elements[id].addEventListener("input", calculate));
files.addEventListener("change", readFiles);
document.getElementById("parseBtn").addEventListener("click", parseNotes);
document.getElementById("resetBtn").addEventListener("click", resetForm);
document.getElementById("copyBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(estimateText.textContent);
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

calculate();
