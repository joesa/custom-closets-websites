/**
 * The password screen a business sees before their spec site.
 *
 * Written to answer the three questions somebody has when an unexpected text
 * sends them to a website with their own name on it: what is this, who else can
 * see it, and what happens next. Saying "only you can see this" plainly is the
 * point — the password is as much reassurance as it is access control.
 */
export default function SpecPreviewGate({
  businessName,
  nextPath,
  error,
}: {
  businessName: string;
  nextPath: string;
  error?: boolean;
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#11101a',
        color: '#f4f2ee',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '30rem', width: '100%' }}>
        <p
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.6,
            margin: 0,
          }}
        >
          Private preview
        </p>
        <h1 style={{ fontSize: '1.9rem', lineHeight: 1.2, margin: '0.6rem 0 0.9rem' }}>
          {businessName}
        </h1>
        <p style={{ opacity: 0.8, lineHeight: 1.6, margin: '0 0 1.4rem' }}>
          This is the website we built for you. It is private — only someone with the password
          from your text message can open it, and search engines are told to ignore it. Nobody
          else will find it.
        </p>

        <form method="POST" action="/api/spec-preview">
          <input type="hidden" name="next" value={nextPath} />
          <label
            htmlFor="spec-password"
            style={{ display: 'block', fontSize: '0.85rem', opacity: 0.75, marginBottom: '0.4rem' }}
          >
            Password from your text message
          </label>
          <input
            id="spec-password"
            name="password"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="XXXX-XXXX"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              fontSize: '1.05rem',
              letterSpacing: '0.08em',
              borderRadius: '0.5rem',
              border: `1px solid ${error ? '#e06c6c' : 'rgba(255,255,255,0.22)'}`,
              background: 'rgba(255,255,255,0.06)',
              color: '#f4f2ee',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ color: '#e79a9a', fontSize: '0.85rem', margin: '0.6rem 0 0' }}>
              That password did not match. It is in the text message we sent you.
            </p>
          )}
          <button
            type="submit"
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.85rem 1rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '0.5rem',
              border: 'none',
              background: '#7d3b3b',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            View my website
          </button>
        </form>

        <p style={{ opacity: 0.55, fontSize: '0.8rem', lineHeight: 1.6, marginTop: '1.6rem' }}>
          It stays private until you decide to go ahead. Lost the password? Reply to the text and
          we will send it again.
        </p>
      </div>
    </main>
  );
}
