import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectLocaleFromHeader } from '@/lib/i18n/detect-locale';

export default async function RootPage() {
  const headerStore = await headers();
  const locale = detectLocaleFromHeader(headerStore.get('accept-language'));
  redirect(`/${locale}`);
}
