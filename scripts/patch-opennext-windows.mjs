/**
 * OpenNext's Windows bundler uses symlinkSync; without Developer Mode that
 * throws EPERM. Re-apply a copy fallback in node_modules before deploy.
 * Prefer enabling Windows Developer Mode long-term.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const target = join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "aws",
  "dist",
  "build",
  "copyTracedFiles.js",
);

const src = readFileSync(target, "utf8");
if (src.includes("Windows without symlink privilege")) {
  console.log("OpenNext Windows symlink patch already present");
  process.exit(0);
}

const needle = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;

const replacement = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code === "EEXIST") {
                    // ok
                }
                else if (e.code === "EPERM" || e.code === "ENOSYS") {
                    // Windows without symlink privilege — copy instead of link
                    try {
                        if (statSync(from).isDirectory()) {
                            cpSync(from, to, { recursive: true });
                        }
                        else {
                            copyFileAndMakeOwnerWritable(from, to);
                        }
                    }
                    catch (copyErr) {
                        logger.debug("Error copying file after symlink EPERM:", copyErr);
                        erroredFiles.push(to);
                    }
                }
                else {
                    throw e;
                }
            }
        }`;

if (!src.includes(needle)) {
  console.error("OpenNext copyTracedFiles.js changed — update scripts/patch-opennext-windows.mjs");
  process.exit(1);
}

writeFileSync(target, src.replace(needle, replacement));
console.log("Patched OpenNext Windows symlink fallback");
