import type { Metadata } from "next";
import { Inter} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import getUser from "@/utils/supabase/server";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X Platform",
  description: "A social media clone of the X platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const userId = user?.id || null;

  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen w-full flex-col">
              <Header userId={userId} />
              <main className="flex flex-1 flex-col px-4 pt-10 xl:px-8">{children}</main>
              <Toaster />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}