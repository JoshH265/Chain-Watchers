import type { Metadata } from "next";
import "./globals.css";
import NavBar from '../components/nav-bar';
import Footer from '../components/footer';

export const metadata: Metadata = {
  title: "Chain Watchers",
  description: "Crypto Wallet Tracking & Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}