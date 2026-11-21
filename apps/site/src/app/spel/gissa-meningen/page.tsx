import { SentenceGuesserGame } from '@/components/games/sentenceGuesser/SentenceGuesserGame';

export default async function Page() {
  return (
    <div className='min-h-dvh flex justify-center bg-default-main'>
      <main className='min-h-dvh w-full'>
        <SentenceGuesserGame />
      </main>
    </div>
  );
}
