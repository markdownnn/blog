import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../core/queries';
import { toUrlSlug } from '../core/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'mark - building in public',
    description: '엔지니어의 사이드 프로젝트 기록',
    site: context.site ?? 'https://example.vercel.app',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/blog/${toUrlSlug(p.id)}`,
    })),
  });
}
