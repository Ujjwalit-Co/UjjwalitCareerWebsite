import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ApplyRedirectPage() {
  redirect('/careers#programs');
}
