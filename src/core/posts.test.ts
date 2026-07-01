// ASCII only. Pure-function tests for core/posts.ts.
// NOTE: Astro 7 uses the glob-loader Content Layer API. Entries expose `.id` (NOT `.slug`).
import { describe, it, expect } from 'vitest';
import {
  filterPublished, sortByDateDesc, byTag, byCategory, byProject, toUrlSlug,
  type Post,
} from './posts';

function post(over: Partial<Post['data']> & { id?: string }): Post {
  const { id = 'x', ...data } = over;
  return {
    id, collection: 'posts',
    data: {
      title: 't', description: 'd', date: new Date('2026-01-01'),
      category: 'notes', tags: [], draft: false, ...data,
    },
  } as unknown as Post;
}

describe('filterPublished', () => {
  it('removes draft:true posts', () => {
    const out = filterPublished([post({ id: 'a' }), post({ id: 'b', draft: true })]);
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('sortByDateDesc', () => {
  it('newest first', () => {
    const out = sortByDateDesc([
      post({ id: 'old', date: new Date('2026-01-01') }),
      post({ id: 'new', date: new Date('2026-06-01') }),
    ]);
    expect(out.map(p => p.id)).toEqual(['new', 'old']);
  });
});

describe('byTag', () => {
  it('keeps posts containing the tag', () => {
    const out = byTag([post({ id: 'a', tags: ['astro'] }), post({ id: 'b', tags: ['saju'] })], 'astro');
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('byCategory', () => {
  it('filters by category', () => {
    const out = byCategory([post({ id: 'a', category: 'engineering' }), post({ id: 'b', category: 'notes' })], 'engineering');
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('byProject', () => {
  it('filters by project', () => {
    const out = byProject([post({ id: 'a', project: 'saju-app' }), post({ id: 'b' })], 'saju-app');
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('toUrlSlug', () => {
  it('strips date prefix', () => {
    expect(toUrlSlug('2026-07-01-recall-prd-writing')).toBe('recall-prd-writing');
  });
  it('strips .draft suffix', () => {
    expect(toUrlSlug('2026-07-01-recall-prd-writing.draft')).toBe('recall-prd-writing');
  });
  it('leaves a plain slug unchanged', () => {
    expect(toUrlSlug('market-notes')).toBe('market-notes');
  });
});
