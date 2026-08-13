import { describe, expect, it } from 'vitest';
import { auditDesignQuality, type DesignArchetype } from './designAudit';

const foundation = `
  :root { --surface:#fff; --ink:#171717; --accent:#a33; --line:#bbb; --space:clamp(1rem,4vw,4rem); }
  body { color:var(--ink); background:var(--surface); }
  section { padding:var(--space); }
  a:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
  .card { border:1px solid var(--line); }
  @media (max-width: 700px) { .layout { grid-template-columns:1fr; } }
  @media (prefers-reduced-motion: reduce) { * { animation:none!important; transition:none!important; } }
`;

const content = `
  <main>
    <section><h1>Oak shelving, installed in 14 days</h1><p>Choose the finish during your in-home appointment.</p></section>
    <section><h2>Built for this room</h2><p>Installation includes wall preparation and final adjustment.</p></section>
    <section><h2>Recent work</h2><img src="https://example.com/work.jpg" alt="Oak shelves" /></section>
    <section><h2>Materials</h2><p>Solid oak with a hand-applied finish.</p><ul><li>Natural</li><li>Walnut</li></ul></section>
  </main>
`;

const directionCss: Record<DesignArchetype, string> = {
  editorial: `
    h1 { font-family:Garamond,serif; } article { column-count:2; }
    .layout { display:grid; grid-template-columns:2fr 1fr; border-top:1px solid var(--line); }
  `,
  cinematic: `
    .hero { min-height:90vh; position:relative; }
    .hero img { position:absolute; inset:0; object-fit:cover; }
    .hero:after { background:linear-gradient(transparent,rgba(0,0,0,.7)); }
  `,
  catalog: `
    .layout { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); }
  `,
  playful: `
    .card { border-radius:32px; transform:rotate(-1deg); clip-path:polygon(0 2%,100% 0,98% 100%,2% 98%); }
    :root { --one:#ed6a5a; --two:#f4f1bb; --three:#9bc1bc; --four:#5ca4a9; --five:#e6ebe0; --six:#f0b67f; }
  `,
  quiet: `
    p { max-width:68ch; } section { padding-block:clamp(4rem,8vw,8rem); }
  `,
  utility: `
    header { position:sticky; top:0; } h1 { font-weight:800; }
    .card { border:2px solid var(--line); }
  `,
};

describe('auditDesignQuality', () => {
  it.each(Object.keys(directionCss) as DesignArchetype[])(
    'accepts a coherent %s direction without requiring house-style details',
    (archetype) => {
      const html = archetype === 'utility'
        ? `${content}<a href="tel:+15555550123">Call for an appointment</a>`
        : content;
      const report = auditDesignQuality(html, `${foundation}${directionCss[archetype]}`, {
        archetype,
      });

      expect(report.passed).toBe(true);
      expect(report.archetype).toBe(archetype);
      expect(report.score).toBe(100);
      expect(report.checks.map((check) => check.name)).not.toContain('Eyebrow Typography');
      expect(report.checks.map((check) => check.name)).not.toContain('Hairline Divider System');
    }
  );

  it('catches banned AI tell-words', () => {
    const html = '<h1>We offer cutting-edge solutions</h1><p>We leverage state-of-the-art technology.</p>';
    const report = auditDesignQuality(html);

    expect(report.passed).toBe(false);
    expect(report.bannedWordsFound).toEqual(
      expect.arrayContaining(['solutions', 'leverage', 'cutting-edge', 'state-of-the-art'])
    );
  });

  it('fails a skin with no responsive, interaction, or design-system contract', () => {
    const report = auditDesignQuality(content, '.card { color:#222; padding:20px; }', {
      archetype: 'catalog',
    });

    expect(report.passed).toBe(false);
    expect(report.score).toBeLessThan(80);
    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('design tokens'),
        expect.stringContaining('breakpoint'),
        expect.stringContaining('keyboard focus'),
      ])
    );
  });
});
