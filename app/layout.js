import './globals.css';

export const metadata = {
  title: 'Mahjong Tile Generator',
  description: 'Pick and arrange Mahjong tiles, sort them, and download your layout as an image.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
