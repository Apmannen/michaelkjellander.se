'use client';

import { useState } from 'react';
import { PostList } from '@/components/PostCard';
import { Post } from '@/data/types';

const matches = (post: Post, query: string) => {
  const haystack = [post.title, post.excerpt, post.kind === 'game' ? post.subtitle : ''].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
};

export const SearchPosts = ({ posts }: { posts: Post[] }) => {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const results = trimmed ? posts.filter((post) => matches(post, trimmed)) : posts;

  return (
    <>
      <input
        type='search'
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Sök bland inlägg…'
        className='mb-6 w-full rounded-md border border-line bg-default-box px-4 py-3 text-[18px] outline-none focus:border-accent-800'
      />
      <PostList posts={results} />
    </>
  );
};
