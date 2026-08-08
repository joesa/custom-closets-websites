import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function productionSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionSources(path);
    if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.includes('.test.')) return [];
    return [path];
  });
}

describe('production typography tracking', () => {
  it('does not compress letter spacing', () => {
    const tightToken = ['tracking', 'tight'].join('-');
    const negativeToken = ['tracking', '[-'].join('-');
    const root = join(process.cwd(), 'src');
    const failures = productionSources(root).filter((path) => {
      const source = readFileSync(path, 'utf8');
      return source.includes(tightToken) || source.includes(negativeToken);
    });

    expect(failures).toEqual([]);
  });
});