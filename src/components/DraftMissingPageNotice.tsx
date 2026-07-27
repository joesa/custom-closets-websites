/**
 * Draft preview hit a nav link that is not in custom_config_draft (or has empty
 * HTML). Prefer this over silently falling through to the old engine template.
 */
export default function DraftMissingPageNotice({
  brandName,
  path,
  availablePaths,
}: {
  brandName: string
  path: string
  availablePaths: string[]
}) {
  const available =
    availablePaths.length > 0 ? availablePaths.join(', ') : '(none)'
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
      <div style={{ maxWidth: 560, lineHeight: 1.5 }}>
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
          No draft for {path}
        </h1>
        <p style={{ margin: '0 0 0.75rem', color: '#3f3f46' }}>
          {brandName || 'This site'}’s Custom Build draft does not include a
          usable page at <code>{path}</code>. Falling back to the live/engine
          template would look like an incomplete redesign — so preview stops
          here.
        </p>
        <p style={{ margin: '0 0 0.75rem', color: '#3f3f46' }}>
          Draft pages present: {available}
        </p>
        <p style={{ margin: 0, color: '#3f3f46' }}>
          Re-run Full redesign (or a surgical edit for this page). Incomplete
          multi-page drafts are now rejected server-side so this should not
          recur.
        </p>
      </div>
    </main>
  )
}
