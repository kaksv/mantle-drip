import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drip - Programmable Payments on Celo",
  description: "Real-time payment streaming and recurring subscriptions on Celo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <WalletProvider>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Toaster position="top-right" />
        </WalletProvider>
      </body>
    </html>
  );
}
