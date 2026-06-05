import './globals.css';

export const metadata = {
  title: 'PhotoStore',
  description: 'Your private photo storage',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
