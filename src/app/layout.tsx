import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { BackgroundParticles } from "@/components/layout/background-particles";
import { AIAvatar } from "@/components/layout/ai-avatar";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/layout/auth-provider";
import ErrorBoundary from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "NovaPath",
  description:
    "Revolutionizing student career guidance with breathtaking aesthetics and immersive interactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Source+Code+Pro:ital,wght@0,200..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "font-body antialiased bg-background text-foreground min-h-screen"
        )}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <div className="flex flex-col min-h-screen">
                <BackgroundParticles />
                <Header />
                <main className="relative z-10 flex-grow">{children}</main>
                <Footer />
              </div>
              <AIAvatar />
              <Toaster />
              <Analytics />
            </ThemeProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
