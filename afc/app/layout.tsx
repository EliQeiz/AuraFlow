import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AFC · AuraFlow Class',
  description: 'Practical technology learning, assessment, and professional certification.',
  referrer: 'no-referrer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
