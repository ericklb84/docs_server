const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = process.cwd();
const buildDir = path.join(root, "build");
const noCheck = process.argv[2] === "no-check";

// 1. Limpar e criar ./build
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// 2. Build do server: bundle autocontido em build/index.js (inclui cors, express)
if (!noCheck) {
  execSync("npm run build --prefix server", { stdio: "inherit", cwd: root });
}
execSync("npm run build:standalone --prefix server", {
  stdio: "inherit",
  cwd: root,
});

// 3. Build do client para build/static
execSync(noCheck ? "npm run build:no-check --prefix client" : "npm run build --prefix client", {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, VITE_OUT_DIR: path.join(buildDir, "static") },
});

// 5. package.json em build/
fs.writeFileSync(
  path.join(buildDir, "package.json"),
  JSON.stringify(
    {
      type: "module",
      private: true,
      scripts: { start: "node index.js" },
    },
    null,
    2
  )
);

console.log("\n✓ Build em ./build pronto. Para subir: cd build && npm start");
