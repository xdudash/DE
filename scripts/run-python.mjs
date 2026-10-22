// Runs a Python script with the first interpreter that actually works: `python3` on
// Linux/macOS, `python` or `py` on Windows, where `python3` is often only the Microsoft
// Store placeholder. The script runs once, so a failing check is reported once.
import { spawnSync } from "node:child_process";

const [script, ...args] = process.argv.slice(2);
if (!script) {
  console.error("usage: node scripts/run-python.mjs <script.py> [args...]");
  process.exit(2);
}

const candidates = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
const works = (cmd) => spawnSync(cmd, ["-c", "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)"], { stdio: "ignore" }).status === 0;
const python = candidates.find(works);
if (!python) {
  console.error(`No working Python 3.9+ found (tried ${candidates.join(", ")}).`);
  process.exit(2);
}

const run = spawnSync(python, [script, ...args], { stdio: "inherit" });
process.exit(run.status ?? 1);
