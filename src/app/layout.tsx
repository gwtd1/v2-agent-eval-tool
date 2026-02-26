import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SetupProvider } from "@/contexts/SetupContext";
import { ApiKeySetupModal } from "@/components/setup/ApiKeySetupModal";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Agent Evaluation Tool",
  description: "Evaluate and test LLM agent performance with human-in-the-loop evaluation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SetupProvider>
          <ApiKeySetupModal />
          {children}
        </SetupProvider>
      </body>
    </html>
  );
}
