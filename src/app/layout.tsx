import "./globals.css";
import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import AppHeader from "../components/AppHeader";
import LeftSidebar from "../components/LeftSidebar";
import AppNav from "../components/AppNav";

export const metadata: Metadata = {
  title: "OmniMediaTrak",
  description: "Private alpha MVP",
  openGraph: {
    title: "OmniMediaTrak",
    description: "Private alpha MVP",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <AppHeader />
        </Suspense>

        <div className="frame">
          <AppNav />

          <main className="main">
            <aside className="left">
              <Suspense fallback={null}>
                <LeftSidebar />
              </Suspense>
            </aside>
            <section className="center">{children}</section>
            <aside className="right">
              <div className="ad-slot">
                <Image
                  src="/images/right-ad-placeholder.svg"
                  alt="Right ad slot"
                  width={300}
                  height={600}
                />
              </div>
            </aside>
          </main>

          <footer className="footer">
            <p>&copy; OmniMedia Solutions</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
