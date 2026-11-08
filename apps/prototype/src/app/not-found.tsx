import Link from 'next/link';
import { PageTitle } from '@/components/PageTitle';

export default function NotFound() {
  return (
    <>
      <PageTitle title='Hittades inte' intro='Sidan du letar efter finns inte.' />
      <Link href='/' className='text-accent-800 underline'>
        Tillbaka till inläggen
      </Link>
    </>
  );
}
