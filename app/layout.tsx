import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { env } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { HeaderSignInButton } from "@/components/HeaderSignInButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl()),
  title: {
    default: "KnownFor: Discover what you are known for",
    template: "%s · KnownFor",
  },
  description:
    "KnownFor helps professionals collect short, authentic feedback from the people they work with, so they can understand and share their real strengths.",
  openGraph: {
    title: "KnownFor: Discover what you are known for",
    description:
      "Collect short, authentic feedback from the people you work with and turn it into a professional reputation wall.",
    url: env.siteUrl(),
    siteName: "KnownFor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KnownFor",
    description:
      "Discover what you are known for through the people you work with.",
  },
};

async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b border-line/70 bg-canvas/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Known<span className="text-brand">For</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {profile ? (
            <Link href="/admin">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <HeaderSignInButton />
          )}
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line/70">
      <div className="container-page flex flex-col items-center justify-between gap-2 py-8 text-sm text-ink-muted sm:flex-row">
        <p>
          Known<span className="text-brand">For</span> · knownfor.eu
        </p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <p>Discover what you are known for through the people you work with.</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
