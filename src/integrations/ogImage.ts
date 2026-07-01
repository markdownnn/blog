// astro-og-canvas@0.13.0: OGImageRoute returns a Promise (needs await); no `param` field.
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { toUrlSlug } from '../core/posts';

const posts = await getCollection('posts');

// key = URL slug (from entry.id, Astro 7 glob loader), value = category (english text only)
const pages = Object.fromEntries(
  posts.map((p) => [toUrlSlug(p.id), { category: p.data.category }]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page: { category: string }) => ({
    title: 'mark - building in public',
    description: page.category,
    bgGradient: [[24, 24, 27]],
    font: { title: { color: [255, 255, 255] }, description: { color: [161, 161, 170] } },
  }),
});
