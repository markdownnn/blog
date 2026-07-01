import { getCollection } from 'astro:content';
import { filterPublished, sortByDateDesc, type Post, type Project } from './posts';

// 사이트 노출용: draft 제외 + 최신순. 모든 페이지/RSS/사이트맵이 이걸 쓴다.
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  return sortByDateDesc(filterPublished(all));
}

// dev 미리보기용: draft 포함(초안 확인). 절대 사이트 페이지 생성에 쓰지 말 것.
export async function getAllPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  return sortByDateDesc(all);
}

export async function getProjects(): Promise<Project[]> {
  return getCollection('projects');
}
