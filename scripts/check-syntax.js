/* scripts/check-syntax.js — Verification reutilisable de syntaxe et d'integrite */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
let hasError = false;

function fail(msg) {
  console.error("ERREUR :", msg);
  hasError = true;
}

function ok(msg) {
  console.log("OK     :", msg);
}

// 1. Tous les fichiers .js a la racine du depot
const jsFiles = fs
  .readdirSync(rootDir)
  .filter((f) => f.endsWith(".js") && fs.statSync(path.join(rootDir, f)).isFile());

for (const file of jsFiles) {
  const fullPath = path.join(rootDir, file);
  const res = spawnSync(process.execPath, ["--check", fullPath], { encoding: "utf8" });
  if (res.status === 0) {
    ok(`JS syntaxe valide -> ${file}`);
  } else {
    fail(`JS syntaxe invalide -> ${file}\n${res.stderr || res.stdout}`);
  }
}

// 2. Fichiers HTML cles : verification des src locaux et blocs JS inline
const htmlCandidates = ["index.html", "XaalyaData.html"].filter((f) =>
  fs.existsSync(path.join(rootDir, f))
);

for (const htmlFile of htmlCandidates) {
  const html = fs.readFileSync(path.join(rootDir, htmlFile), "utf8");
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let idx = 0;
  let inlineChecked = 0;

  while ((match = scriptRegex.exec(html)) !== null) {
    idx += 1;
    const attrs = match[1] || "";
    const body = match[2] || "";
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    const scriptType = typeMatch ? typeMatch[1].toLowerCase() : "";

    if (srcMatch) {
      const srcPath = srcMatch[1];
      if (!/^https?:\/\//i.test(srcPath)) {
        const cleanRel = srcPath.split("?")[0];
        if (fs.existsSync(path.join(rootDir, cleanRel))) {
          ok(`HTML ${htmlFile} script #${idx} src existant -> ${cleanRel}`);
        } else {
          fail(`HTML ${htmlFile} script #${idx} src introuvable -> ${cleanRel}`);
        }
      }
      continue;
    }

    if (scriptType && !scriptType.includes("javascript") && scriptType !== "module") {
      continue;
    }

    if (body.trim().length > 0) {
      inlineChecked += 1;
      try {
        new vm.Script(body, { filename: `${htmlFile}:inline#${idx}` });
      } catch (err) {
        fail(`HTML ${htmlFile} script inline #${idx} invalide -> ${err.message}`);
      }
    }
  }

  ok(`HTML ${htmlFile} -> ${inlineChecked} bloc(s) JS inline verifie(s)`);
}

// 3. Verification de rates.json si present
const ratesPath = path.join(rootDir, "rates.json");
if (fs.existsSync(ratesPath)) {
  try {
    const parsedRates = JSON.parse(fs.readFileSync(ratesPath, "utf8"));
    const count = parsedRates && parsedRates.rates ? Object.keys(parsedRates.rates).length : 0;
    ok(`JSON valide -> rates.json (${count} devises)`);
  } catch (err) {
    fail(`JSON invalide -> rates.json (${err.message})`);
  }
}

// 4. Verification fonctionnelle de xaalyaData.js
const dataPath = path.join(rootDir, "xaalyaData.js");
if (fs.existsSync(dataPath)) {
  try {
    const XaalyaData = require(dataPath);
    const keys = Object.keys(XaalyaData.SWIFT_BENCHMARKS || {});
    const testBench = XaalyaData.computeBankBenchmark({
      source: "EUR",
      target: "XOF",
      amount: 1000
    });
    if (keys.length >= 13 && Number.isFinite(testBench.netCentral) && testBench.netCentral > 0) {
      ok(`XaalyaData fonctionnel -> ${keys.length} corridors, EUR->XOF netCentral=${testBench.netCentral.toFixed(2)}`);
    } else {
      fail("XaalyaData a retourne un resultat inattendu sur EUR->XOF");
    }
  } catch (err) {
    fail(`Erreur execution XaalyaData -> ${err.message}`);
  }
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log("\nToutes les verifications de syntaxe et d'integrite sont passees.");
}
