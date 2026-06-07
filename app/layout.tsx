import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { env } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries";
import { Button } from "@/components/ui/Button";

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

const navLinkClass =
  "inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-canvas-subtle hover:text-ink";

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
            <>
              {profile.public_slug && (
                <Link href={`/${profile.public_slug}`} className={navLinkClass}>
                  My profile
                </Link>
              )}
              <Link href="/admin">
                <Button size="sm">Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={navLinkClass}>
                Sign in
              </Link>
              <Link href="/login">
                <Button size="sm">Get started</Button>
              </Link>
            </>
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
        <p>Discover what you are known for through the people you work with.</p>
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
