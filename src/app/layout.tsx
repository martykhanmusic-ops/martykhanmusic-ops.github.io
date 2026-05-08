import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'STACKFAST | AI App Builder Dashboard',
  description: 'A futuristic dashboard for planning, generating, testing, deploying, and monitoring full-stack AI-built apps.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} noise min-h-screen font-sans`}>
        {children}
      </body>
    </html>
  );
}
