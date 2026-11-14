import { permanentRedirect } from 'next/navigation';
import 'server-only';

export default async function Page() {
  return permanentRedirect('/');
}
