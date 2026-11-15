import { MainShell } from '@/components/shells/MainShell';
import { Button } from '@/components/standard/Button';

export default function Custom404() {
  return (
    <MainShell>
      <div className='max-w-content mx-auto'>
        <h1 className='text-[48px] font-bold leading-none tracking-[-0.03em]'>
          404 - Sidan finns inte
        </h1>
        <h2 className='pt-3 text-[19px] italic text-muted'>
          Sidan du försökte nå finns inte på michaelkjellander.se
        </h2>
        <div className='flex pt-6'>
          <Button href='/' iconName='FaHome'>Gå till startsidan</Button>
        </div>
      </div>
    </MainShell>
  );
}
