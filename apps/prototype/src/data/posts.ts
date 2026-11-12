import { CategoryId, Post } from './types';

const posts: Post[] = [
  {
    kind: 'game',
    slug: 'ludde',
    title: 'Ludde',
    subtitle: 'Ett personligt samlarspel i Unity 3D',
    category: 'spelutveckling',
    publishedAt: '2023-11-02',
    tags: ['Unity', '3D', 'Samlarspel', 'Steam'],
    years: '2021–2023',
    engine: 'Unity',
    store: { platform: 'steam', href: 'https://store.steampowered.com/' },
    cover: { src: '/images/ludde-cover.svg', alt: 'Ludde står i snön och tittar ut mot en fyr i solnedgången' },
    excerpt:
      'Ett charmigt och avkopplande samlarspel i 3D som jag byggde på fritiden mellan 2021 och 2023.',
    lead:
      'Ludde är ett samlarspel i 3D som jag utvecklade på fritiden mellan 2021 och 2023. Målet var enkelt: att skapa ett charmigt och avkopplande spel med utforskning, samlande och en egen liten värld att vila i.',
    body: [
      {
        type: 'paragraph',
        text: 'Spelet är byggt i Unity och tog form steg för steg – från tidiga prototyper till en färdig version på Steam. Här delar jag med mig av processen, tankarna bakom designen och några av de utmaningar jag stötte på längs vägen.',
      },
      { type: 'divider' },
      {
        type: 'feature',
        heading: 'Världen och känslan',
        text: 'Jag ville skapa en lugn men levande värld, med tydlig spelglädje och en känsla av upptäckarlust. Resultatet blev en vintermiljö med öppna områden, små hemligheter och massor att samla.',
        image: { src: '/images/ludde-world.svg', alt: 'Ludde går genom en snöig skog med glänsande mynt' },
      },
      {
        type: 'feature',
        heading: 'Prototyper och vägval',
        text: 'Den första versionen var en grå kub som hoppade mellan plattformar. Först när kameran och rörelsen kändes rätt började jag bygga världen runt omkring.',
        image: { src: '/images/ludde-proto.svg', alt: 'Tidig gråboxad prototyp av Ludde' },
        imageSide: 'left',
      },
      { type: 'divider' },
      { type: 'heading', text: 'Det svåraste' },
      {
        type: 'paragraph',
        text: 'Det svåraste var inte koden utan att bli klar. Varje gång en del kändes färdig upptäckte jag tre nya saker jag ville lägga till. Till slut skrev jag en lista med det som måste vara med, och strök allt annat.',
        marks: [{ type: 'bold', start: 33, end: 45 }],
      },
      {
        type: 'quote',
        text: 'Ett spel blir aldrig färdigt, det blir bara släppt.',
        author: 'Okänd',
      },
    ],
  },
  {
    kind: 'review',
    slug: 'iconoclasts',
    title: 'Iconoclasts',
    category: 'recensioner',
    publishedAt: '2024-03-18',
    tags: ['Metroidvania', 'Pixelgrafik', 'Nintendo Switch'],
    platform: 'Nintendo Switch',
    rating: 5,
    verdict: 'Fantastiskt',
    alsoPlay: { title: 'The Mummy Demastered', slug: 'the-mummy-demastered' },
    cover: { src: '/images/iconoclasts-cover.svg', alt: 'Pixelgrafik: en figur står på en klippkant framför en ruin' },
    excerpt: 'Ett fängslande metroidvania med tajt spelupplägg, handgjord pixelgrafik och en berättelse med tyngd.',
    lead:
      'Iconoclasts är ett fängslande metroidvania som imponerar med sitt tajta spelupplägg, handgjorda pixelgrafik och en berättelse som väger betydligt tyngre än man först anar. Det är ett spel som förenar klassisk utforskarglädje med starka karaktärer och oväntat mycket hjärta.',
    body: [
      {
        type: 'paragraph',
        text: 'Kontrollen är responsiv, banorna smart designade och variationen i både plattforming och pussel håller tempot uppe hela vägen. Berättelsen tar upp stora teman, men gör det på ett personligt och effektivt sätt.',
      },
    ],
  },
  {
    kind: 'review',
    slug: 'the-mummy-demastered',
    title: 'The Mummy Demastered',
    category: 'recensioner',
    publishedAt: '2024-01-07',
    tags: ['Metroidvania', 'Pixelgrafik', 'PC'],
    platform: 'PC',
    rating: 3.5,
    verdict: 'Riktigt bra',
    cover: { src: '/images/mummy-cover.svg', alt: 'Pixelgrafik: en öken med pyramider i skymningen' },
    excerpt: 'En retroinspirerad action-metroidvania som är svår, kantig och förvånansvärt beroendeframkallande.',
    lead:
      'The Mummy Demastered är ett av de där spelen man inte förväntar sig något av, och som sedan håller kvar en i timmar. Det är tufft, ibland orättvist, men det sitter ihop på ett sätt som gör att man vill försöka en gång till.',
    body: [
      {
        type: 'paragraph',
        text: 'Det mest originella greppet är att när du dör blir din förra soldat en zombie som du måste besegra för att få tillbaka din utrustning. Det gör varje död lite mer kännbar – och lite mer intressant.',
      },
      {
        type: 'paragraph',
        text: 'Kartan är kompakt och hemligheterna många, lite som i Iconoclasts. Bossarna är höjdpunkterna, även om ett par av dem drar ut lite väl länge på tiden.',
        marks: [{ type: 'link', start: 54, end: 65, href: '/inlagg/iconoclasts' }],
      },
      { type: 'divider' },
      { type: 'heading', text: 'Läs mer' },
      {
        type: 'list',
        items: [
          {
            text: 'The Mummy Demastered på Steam',
            marks: [{ type: 'link', start: 0, end: 29, href: 'https://store.steampowered.com/search/?term=the+mummy+demastered' }],
          },
          {
            text: 'WayForward – studion bakom spelet',
            marks: [{ type: 'link', start: 0, end: 10, href: 'https://wayforward.com/' }],
          },
          {
            text: 'Wikipedia-artikeln om spelet',
            marks: [{ type: 'link', start: 0, end: 28, href: 'https://en.wikipedia.org/wiki/The_Mummy_Demastered' }],
          },
          {
            text: 'Min recension av Iconoclasts, ett annat metroidvania värt att spela',
            marks: [{ type: 'link', start: 0, end: 28, href: '/inlagg/iconoclasts' }],
          },
        ],
      },
      { type: 'heading', text: 'Läs mer' },
      {
        type: 'list',
        items: [
          {
            icon: 'steam',
            text: 'The Mummy Demastered på Steam',
            marks: [{ type: 'link', start: 0, end: 29, href: 'https://store.steampowered.com/search/?term=the+mummy+demastered' }],
          },
          {
            icon: 'studio',
            text: 'WayForward – studion bakom spelet',
            marks: [{ type: 'link', start: 0, end: 10, href: 'https://wayforward.com/' }],
          },
          {
            icon: 'wikipedia',
            text: 'Wikipedia-artikeln om spelet',
            marks: [{ type: 'link', start: 0, end: 28, href: 'https://en.wikipedia.org/wiki/The_Mummy_Demastered' }],
          },
          {
            icon: 'review',
            text: 'Min recension av Iconoclasts, ett annat metroidvania värt att spela',
            marks: [{ type: 'link', start: 0, end: 28, href: '/inlagg/iconoclasts' }],
          },
        ],
      },
    ],
  },
  {
    kind: 'game',
    slug: 'pixelpussel',
    title: 'Pixelpussel',
    subtitle: 'Ett litet pusselspel för webben',
    category: 'spelutveckling',
    publishedAt: '2025-06-14',
    tags: ['TypeScript', 'Webbspel', 'Pussel'],
    years: '2025',
    engine: 'TypeScript',
    store: { platform: 'web', href: 'https://example.com/' },
    cover: { src: '/images/pixelpussel-cover.svg', alt: 'Färgglada pusselbitar i ett rutnät' },
    excerpt: 'Ett helgprojekt som växte: korta pussel som går att spela direkt i webbläsaren.',
    lead:
      'Pixelpussel började som ett helgprojekt för att lära mig mer om canvas i webbläsaren, och slutade som ett litet spel med femtio banor.',
    body: [
      {
        type: 'paragraph',
        text: 'Allt är skrivet i TypeScript utan spelmotor. Det gjorde vissa saker mer omständliga, men jag lärde mig väldigt mycket om hur en spelloop faktiskt fungerar.',
      },
    ],
  },
  {
    kind: 'article',
    slug: 'varfor-jag-gor-sma-spel',
    title: 'Varför jag gör små spel',
    category: 'tankar',
    publishedAt: '2025-09-01',
    tags: ['Speldesign', 'Projekt'],
    cover: { src: '/images/tankar-cover.svg', alt: 'En skrivbordslampa lyser över ett anteckningsblock' },
    excerpt: 'Om att välja projekt som faktiskt går att bli klar med.',
    lead:
      'Varje gång jag börjar på något nytt frestas jag att göra det stort. Men de projekt jag är mest nöjd med är nästan alltid de små.',
    body: [
      {
        type: 'paragraph',
        text: 'Ett litet spel går att hålla i huvudet. Man ser hela formen, och man hinner bli klar innan man tröttnar. Det är inte en begränsning, det är en metod.',
      },
    ],
  },
];

const byDateDesc = (a: Post, b: Post) => {
  return b.publishedAt.localeCompare(a.publishedAt);
};

export const getAllPosts = (): Post[] => {
  return [...posts].sort(byDateDesc);
};

export const getPostBySlug = (slug: string): Post | undefined => {
  return posts.find((post) => post.slug === slug);
};

export const getPostsByCategory = (category: CategoryId): Post[] => {
  return getAllPosts().filter((post) => post.category === category);
};
