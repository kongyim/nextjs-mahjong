import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Mahjong Tile Generator',
  description: 'Pick and arrange Mahjong tiles, sort them, and download your layout as an image.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-12NT20J4Y5"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-12NT20J4Y5', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
