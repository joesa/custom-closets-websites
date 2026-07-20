/**
 * Thin wrapper — dashboard script is the source of truth for the check.
 * When websites CI runs alone, compare against sibling if present, else skip.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const websitesRoot = resolve(__dirname, '..')
const dashScript = resolve(
  websitesRoot,
  '../closet-dashboard/scripts/check-custom-site-core-sync.mjs'
)

if (!existsSync(dashScript)) {
  console.warn(
    'closet-dashboard sibling missing — skipping customSite sync check (CUSTOM_SITE_SYNC_SKIP).'
  )
  process.exit(0)
}

const r = spawnSync(
  process.execPath,
  [dashScript, '--websites-root', websitesRoot],
  { stdio: 'inherit' }
)
process.exit(r.status ?? 1)
