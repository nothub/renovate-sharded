// Splits the repos Renovate autodiscovers into chunks and runs one Renovate process per chunk in parallel.

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    console.error(`${name} must be a positive integer, got '${raw}'`);
    process.exit(2);
  }
  return n;
}

const size = intEnv('SHARD_SIZE', 25);
const min = intEnv('SHARDS_MIN', 1);
const max = intEnv('SHARDS_MAX', 4);
if (min > max) {
  console.error(`SHARDS_MIN (${min}) must not be greater than SHARDS_MAX (${max})`);
  process.exit(2);
}

// Per-repo config, e.g. {"owner/repo": {"allowedCommands": ["^make$"]}}. Renovate applies
// global-only options from a repositories[] object entry to that repo alone, and they
// replace the global value instead of merging with it.
let overrides;
try {
  overrides = JSON.parse(process.env.REPO_OVERRIDES || '{}');
} catch {}
if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
  console.error(`REPO_OVERRIDES must be a JSON object, got '${process.env.REPO_OVERRIDES}'`);
  process.exit(2);
}

const baseDir = process.env.RENOVATE_BASE_DIR || '/tmp/renovate';
const children = new Set();

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    for (const child of children) child.kill(sig);
  });
}

function renovate(tag, args, env) {
  return new Promise((resolve) => {
    const child = spawn('renovate', args, {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    for (const [from, to] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      createInterface({ input: from }).on('line', (line) => to.write(`[${tag}] ${line}\n`));
    }
    child.on('error', (err) => {
      console.error(`[${tag}] ${err.message}`);
      resolve(1);
    });
    child.on('close', (code) => {
      children.delete(child);
      resolve(code ?? 1);
    });
  });
}

const listFile = `${baseDir}/discovered.json`;
if ((await renovate('discover', [`--write-discovered-repos=${listFile}`], {})) !== 0) {
  process.exit(1);
}

const repos = JSON.parse(await readFile(listFile, 'utf8')).sort();
const n = Math.min(max, Math.max(min, Math.ceil(repos.length / size)));
console.log(`${repos.length} repos, ${n} shards`);

// Split the sorted list into contiguous chunks. Adding or removing one repo then shifts
// each chunk boundary by at most one position, so most repos stay in the same shard
// and keep its RENOVATE_BASE_DIR cache. Changing the shard count reshuffles everything.
const codes = await Promise.all(
  Array.from({ length: n }, (_, i) => {
    const chunk = repos.slice(Math.floor((i * repos.length) / n), Math.floor(((i + 1) * repos.length) / n));
    if (chunk.length === 0) return 0;
    return renovate(`shard-${i}`, [], {
      RENOVATE_AUTODISCOVER: 'false',
      RENOVATE_REPOSITORIES: JSON.stringify(chunk.map((repo) => (overrides[repo] ? { repository: repo, ...overrides[repo] } : repo))),
      RENOVATE_BASE_DIR: `${baseDir}/${i}`,
    });
  }),
);
process.exit(codes.some((code) => code !== 0) ? 1 : 0);
