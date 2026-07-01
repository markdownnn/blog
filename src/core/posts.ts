import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;
export type Category = Post['data']['category'];
export type ProjectKey = NonNullable<Post['data']['project']>;

export function filterPublished(posts: Post[]): Post[] {
  return posts.filter((p) => p.data.draft === false);
}

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function byTag(posts: Post[], tag: string): Post[] {
  return posts.filter((p) => p.data.tags.includes(tag));
}

export function byCategory(posts: Post[], category: Category): Post[] {
  return posts.filter((p) => p.data.category === category);
}

export function byProject(posts: Post[], project: ProjectKey): Post[] {
  return posts.filter((p) => p.data.project === project);
}

export function toUrlSlug(slug: string): string {
  return slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.draft$/, '');
}
