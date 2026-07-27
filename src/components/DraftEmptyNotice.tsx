/**
 * Shown when ?draft=1 is on but custom_config_draft has no paint-able pages
 * (e.g. Full redesign "succeeded" with empty pages JSON). Prevents falling
 * through to the live/engine site, which looks like "preview did nothing".
 */
export default function DraftEmptyNotice({ brandName }: { brandName: string }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        background: '#f4f4f5',
        color: '#18181b',
      }}
    >
      <div style={{ maxWidth: 520, lineHeight: 1.5 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#71717a',
          }}
        >
          Draft preview
        </p>
        <h1 style={{ margin: '0.5rem 0 1rem', fontSize: 24, fontWeight: 650 }}>
          No draft pages to show for {brandName || 'this site'}
        </h1>
        <p style={{ margin: '0 0 0.75rem', color: '#3f3f46' }}>
          The Custom Build draft is empty (no home HTML). Preview would otherwise
          fall back to the old live design and look unchanged.
        </p>
        <p style={{ margin: 0, color: '#3f3f46' }}>
          Return to admin → Custom Build → run Full redesign again. If Render
          logs showed OOM / terminated, upgrade the Graphile worker past 512MB
          first.
        </p>
      </div>
    </main>
  )
}
