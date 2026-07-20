/**
 * Thin wrapper — dashboard script is the source of truth for the check
 * (customSite.ts + widgetCdn.ts).
 *
 * Local: uses ../closet-dashboard when present.
 * CI: uses .ci-siblings/closet-dashboard (checked out by the workflow).
 * Never skips when CI/GITHUB_ACTIONS is set.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const websitesRoot = resolve(__dirname, '..')
const inCi = Boolean(process.env.CI || process.env.GITHUB_ACTIONS)

const candidates = [
  resolve(websitesRoot, '.ci-siblings/closet-dashboard/scripts/check-custom-site-core-sync.mjs'),
  resolve(websitesRoot, '../closet-dashboard/scripts/check-custom-site-core-sync.mjs'),
]

const dashScript = candidates.find((p) => existsSync(p))

if (!dashScript) {
  const msg =
    'closet-dashboard sibling missing — cannot verify customSite shared-core sync.\n' +
    'Expected one of:\n' +
    candidates.map((p) => `  ${p}`).join('\n')
  if (inCi) {
    console.error(msg)
    process.exit(1)
  }
  console.warn(`${msg}\nSkipping locally (not in CI).`)
  process.exit(0)
}

const r = spawnSync(
  process.execPath,
  [dashScript, '--websites-root', websitesRoot],
  { stdio: 'inherit' }
)
process.exit(r.status ?? 1)
