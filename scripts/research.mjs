import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = "C:/Users/zzy18/OneDrive/Documents/Obsidian Vault/public";
const mode = process.argv[2];
if (!['build', 'preview'].includes(mode)) throw new Error('Use npm run research:build or npm run research:preview');
const root = await fs.realpath(source);
// Resolve every entry before Quartz sees it; links must not escape the public folder.
async function check(dir, ancestors = new Set()) {
  const real = await fs.realpath(dir);
  const relative = path.relative(root, real);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Link outside public folder: ' + dir);
  const stat = await fs.stat(dir);
  if (!stat.isDirectory()) return;
  if (ancestors.has(real)) throw new Error('Circular directory link: ' + dir);
  const next = new Set(ancestors).add(real);
  for (const name of await fs.readdir(dir)) {
    if (name.startsWith('.') || ['private', 'templates'].includes(name)) continue;
    await check(path.join(dir, name), next);
  }
}
await check(source);
console.log('Publishing source: ' + source);
const args = ['quartz/bootstrap-cli.mjs', 'build', '-d', source, '-o', 'public'];
if (mode === 'preview') args.push('--serve', '--port', '8080');
const child = spawn(process.execPath, args, { cwd: repo, stdio: 'inherit' });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
