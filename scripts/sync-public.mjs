import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import YAML from "yaml"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const source = "C:/Users/zzy18/OneDrive/Documents/Obsidian Vault/public"
const destination = path.join(repo, "content")
const manifestPath = path.join(destination, ".research-sync.json")
const allowed = new Set([".md", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".pdf", ".mp3", ".mp4", ".wav", ".ogg", ".webm"])
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex")
const inside = (root, target) => {
  const rel = path.relative(root, target)
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel))
}
const sourceRoot = await fs.realpath(source)
const desired = new Map()
const skipped = []
async function collect(dir, ancestors = new Set()) {
  const real = await fs.realpath(dir)
  if (!inside(sourceRoot, real)) throw new Error("Source link escapes public: " + dir)
  if (ancestors.has(real)) throw new Error("Circular source link: " + dir)
  const next = new Set(ancestors).add(real)
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["private", "templates"].includes(entry.name.toLowerCase())) continue
    const file = path.join(dir, entry.name)
    if (!inside(sourceRoot, await fs.realpath(file))) throw new Error("Source link escapes public: " + file)
    const stat = await fs.stat(file)
    if (stat.isDirectory()) { await collect(file, next); continue }
    const rel = path.relative(source, file).split(path.sep).join("/")
    if (!stat.isFile() || !allowed.has(path.extname(file).toLowerCase())) { skipped.push(rel); continue }
    const bytes = await fs.readFile(file)
    if (path.extname(file).toLowerCase() === ".md") {
      const text = bytes.toString("utf8").replace(/^\uFEFF/, "")
      const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
      const props = frontmatter ? YAML.parse(frontmatter[1]) : {}
      if ([true, "true"].includes(props?.draft) || [false, "false"].includes(props?.publish)) { skipped.push(rel); continue }
    }
    desired.set(rel, bytes)
  }
}
await collect(source)
if (!desired.has("index.md")) throw new Error("A publishable public/index.md is required; nothing was changed.")
await fs.mkdir(destination, { recursive: true })
if (await fs.realpath(destination) !== destination) throw new Error("Content must be a normal directory, not a link.")
let previous = {}
try { previous = JSON.parse(await fs.readFile(manifestPath, "utf8")) } catch (e) { if (e.code !== "ENOENT") throw e }
// Validate the whole destination before writing. Refuse links or edits made to synced copies.
const existing = new Map()
async function inspect(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) throw new Error("Content contains a link: " + file)
    if (entry.isDirectory()) { await inspect(file); continue }
    const rel = path.relative(destination, file).split(path.sep).join("/")
    if ([".gitkeep", ".research-sync.json"].includes(rel)) continue
    existing.set(rel, await fs.readFile(file))
  }
}
await inspect(destination)
for (const [rel, bytes] of existing) {
  if (previous[rel] !== hash(bytes)) throw new Error("Unmanaged or locally edited content: " + rel + ". Move edits to Obsidian before syncing.")
}
for (const rel of Object.keys(previous)) {
  const target = path.resolve(destination, rel)
  if (!inside(destination, target) || target === destination) throw new Error("Invalid sync manifest path")
}
for (const [rel, bytes] of desired) {
  const target = path.resolve(destination, rel)
  if (!inside(destination, target)) throw new Error("Invalid source path")
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, bytes)
}
for (const rel of existing.keys()) {
  if (!desired.has(rel)) await fs.unlink(path.resolve(destination, rel))
}
await fs.writeFile(manifestPath, JSON.stringify(Object.fromEntries([...desired].map(([rel, bytes]) => [rel, hash(bytes)])), null, 2) + "\n")
console.log(`Synced ${desired.size} public files to content. Obsidian originals are unchanged.`)
if (skipped.length) console.log("Excluded drafts/unpublished/unsupported files:\n" + skipped.join("\n"))
console.log("Review git diff and git status before committing. All copied attachments will be public.")
