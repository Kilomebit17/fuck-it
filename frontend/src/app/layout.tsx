import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/UI/Toast";
import PHProvider from "./providers";
import "@/styles/global.scss";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Fuck IT - Anonymous Social",
    template: "%s | Fuck IT",
  },
  description: "Anonymous social. No profiles. No bullshit.",
  openGraph: {
    type: "website",
    siteName: "Fuck IT",
    title: "Fuck IT - Anonymous Social",
    description: "Anonymous social. No profiles. No bullshit.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "Fuck IT - Anonymous Social",
    description: "Anonymous social. No profiles. No bullshit.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <PHProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  );
}
