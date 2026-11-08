import Image from 'next/image';
import Link from 'next/link';
import { FaQuoteRight } from 'react-icons/fa6';
import { BodyBlock, Mark } from '@/data/types';
import { Divider } from '../Divider';

export const PostBody = ({ blocks }: { blocks: BodyBlock[] }) => {
  return (
    <div className='space-y-5'>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
};

const Block = ({ block }: { block: BodyBlock }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p>
          <RichText text={block.text} marks={block.marks} />
        </p>
      );
    case 'heading':
      return <h2 className='pt-2 text-[28px] font-bold tracking-tight'>{block.text}</h2>;
    case 'divider':
      return <Divider />;
    case 'quote':
      return (
        <figure className='rounded-md border border-accent-200 bg-accent-100 px-5 py-4'>
          <div className='flex gap-5'>
            <FaQuoteRight className='mt-1 shrink-0 text-[28px] text-accent-800' />
            <blockquote className='italic text-muted'>{block.text}</blockquote>
          </div>
          {block.author ? (
            <figcaption className='pt-2 text-center font-semibold text-accent-800'>
              {block.href ? (
                <a href={block.href} target='_blank' rel='noreferrer' className='hover:underline'>
                  {block.author}
                </a>
              ) : (
                block.author
              )}
            </figcaption>
          ) : null}
        </figure>
      );
    case 'feature': {
      const imageLeft = block.imageSide === 'left';
      return (
        <section className={`flex flex-col gap-5 py-2 sm:items-center ${imageLeft ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
          <div className='flex-1'>
            <h2 className='pb-2 text-[26px] font-bold tracking-tight'>{block.heading}</h2>
            <p className='text-[16px] leading-relaxed text-muted'>{block.text}</p>
          </div>
          <Image
            src={block.image.src}
            alt={block.image.alt}
            width={600}
            height={340}
            className='w-full rounded-md shadow-sm sm:w-[42%]'
          />
        </section>
      );
    }
    case 'image':
      return (
        <figure>
          <Image src={block.image.src} alt={block.image.alt} width={1200} height={500} className='w-full rounded-md' />
          {block.caption ? <figcaption className='pt-2 text-[15px] italic text-muted'>{block.caption}</figcaption> : null}
        </figure>
      );
  }
};

/** Delar upp texten vid varje markerings start/slut och lägger på stilar. */
export const RichText = ({ text, marks = [] }: { text: string; marks?: Mark[] }) => {
  if(marks.length === 0) {
    return text;
  }

  const breaks = Array.from(new Set([0, text.length, ...marks.flatMap((m) => [m.start, m.end])]))
    .filter((b) => b >= 0 && b <= text.length)
    .sort((a, b) => a - b);

  return breaks.slice(0, -1).map((start, i) => {
    const end = breaks[i + 1];
    const active = marks.filter((m) => start >= m.start && start < m.end);
    const className = [
      active.some((m) => m.type === 'bold') ? 'font-bold' : '',
      active.some((m) => m.type === 'italic') ? 'italic' : '',
    ].join(' ').trim();
    const link = active.find((m) => m.type === 'link');
    const content = text.slice(start, end);

    if(link) {
      return (
        <Link key={i} href={link.href} className={`${className} underline hover:text-accent-800`}>
          {content}
        </Link>
      );
    }
    return className ? <span key={i} className={className}>{content}</span> : content;
  });
};
