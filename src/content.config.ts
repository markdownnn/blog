import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.date(),
    updated: z.date().optional(),
    category: z.enum(['engineering', 'build-log', 'notes']),
    project: z.enum(['saju-app', 'recall-extension', 'indie-game']).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
    ogImage: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    status: z.enum(['idea', 'building', 'launched', 'paused']),
    startDate: z.date(),
    stack: z.array(z.string()).default([]),
    links: z.object({
      demo: z.string().optional(),
      repo: z.string().optional(),
      store: z.string().optional(),
      waitlist: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { posts, projects };
