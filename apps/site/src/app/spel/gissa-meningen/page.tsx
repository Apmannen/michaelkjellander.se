import { SentenceGuesserGame } from '@/components/games/sentenceGuesser/SentenceGuesserGame';

export default async function Page() {
  return (
    <div className='min-h-dvh flex justify-center bg-default-main'>
      <main className='min-h-dvh w-full'>
        <div className='mx-auto max-w-[640px] px-4 sm:px-8'>
          <SentenceGuesserGame maxLevelNumber={0} autoRedirect={true} />
        </div>
      </main>
    </div>
  );
}
