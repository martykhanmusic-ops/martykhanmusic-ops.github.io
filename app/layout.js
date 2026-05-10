import '../styles/globals.css';

export const metadata = {
  title: 'Marty Khan Music',
  description: 'Marty Khan Music operations landing page.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
