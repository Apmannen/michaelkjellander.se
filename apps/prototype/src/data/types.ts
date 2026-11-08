export type CategoryId = 'spelutveckling' | 'recensioner' | 'tankar';

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
};

export type ImageRef = {
  src: string;
  alt: string;
};

/** Inline-markeringar i ett stycke, samma idé som i CMS:et (start/end i texten). */
export type Mark =
  | { type: 'bold'; start: number; end: number }
  | { type: 'italic'; start: number; end: number }
  | { type: 'link'; start: number; end: number; href: string };

export type BodyBlock =
  | { type: 'paragraph'; text: string; marks?: Mark[] }
  | { type: 'heading'; text: string }
  | { type: 'divider' }
  | { type: 'quote'; text: string; author?: string; href?: string }
  /** Rubrik + kort text med en bild bredvid, som "Världen och känslan" i skissen. */
  | { type: 'feature'; heading: string; text: string; image: ImageRef; imageSide?: 'left' | 'right' }
  | { type: 'image'; image: ImageRef; caption?: string };

type PostBase = {
  slug: string;
  title: string;
  category: CategoryId;
  publishedAt: string;
  cover: ImageRef;
  /** Kort text för listor/kort. */
  excerpt: string;
  /** Första stycket – får anfang (drop cap) på inläggssidan. */
  lead: string;
  body: BodyBlock[];
};

export type StoreLink = {
  platform: 'steam' | 'itch' | 'web';
  href: string;
};

/** Ett spel jag själv har gjort. */
export type GamePost = PostBase & {
  kind: 'game';
  subtitle: string;
  years: string;
  engine: string;
  store?: StoreLink;
};

/** En recension av någon annans spel. */
export type ReviewPost = PostBase & {
  kind: 'review';
  platform: string;
  /** 0–5, halva steg tillåtna. */
  rating: number;
  verdict: string;
  /** Tips om ett annat spel. Pekar på ett inlägg via slug, eller en extern länk. */
  alsoPlay?: { title: string; slug?: string; href?: string };
};

/** Ett vanligt textinlägg. */
export type ArticlePost = PostBase & {
  kind: 'article';
};

export type Post = GamePost | ReviewPost | ArticlePost;
