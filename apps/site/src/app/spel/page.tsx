import { paths } from '@/lib/paths';
import { permanentRedirect } from 'next/navigation';

export default async function Page() {
  return permanentRedirect(paths.myGamesCategory);
}
