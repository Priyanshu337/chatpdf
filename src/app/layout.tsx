import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from 'react-hot-toast';
import Providers from "@/components/ui/provider";
export const metadata: Metadata = {
  title: "ChatPDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider >
      <Providers>
        <html lang="en">
          <body className={inter.className}>{children}</body>
          <Toaster />
        </html >
      </Providers >
    </ClerkProvider >

  );
}
