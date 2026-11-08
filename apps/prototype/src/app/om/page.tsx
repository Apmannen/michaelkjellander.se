import type { Metadata } from 'next';
import { PageTitle } from '@/components/PageTitle';

export const metadata: Metadata = { title: 'Om' };

export default function Page() {
  return (
    <>
      <PageTitle title='Om' />
      <div className='max-w-[640px] space-y-4 text-[19px] leading-[1.6]'>
        <p className='drop-cap'>
          Hej! Jag heter Michael och bygger saker – mest webb och spel. Här skriver jag om det jag gör, det jag spelar
          och det jag lär mig på vägen.
        </p>
        <p>Den här sidan är en prototyp. Allt innehåll är exempeldata.</p>
      </div>
    </>
  );
}
