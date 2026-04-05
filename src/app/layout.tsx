import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Industrial Official Website',
  description: 'Bilingual industrial company website built with Next.js and Directus.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

export function generateStaticParams() {
  return [];
}
