import { useEffect, ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface LegalLayoutProps {
  title: string;
  description: string;
  canonical: string;
  lastUpdated: string;
  children: ReactNode;
}

const LegalLayout = ({ title, description, canonical, lastUpdated, children }: LegalLayoutProps) => {
  useEffect(() => {
    document.title = title;
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", "website", "property");

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }, [title, description, canonical]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative overflow-hidden pt-32 pb-12">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <span className="mb-4 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
            Legal
          </span>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            {title.replace(" | Instruvex", "")}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose prose-invert max-w-none text-foreground/90 leading-relaxed space-y-6
            [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-muted-foreground [&_p]:leading-7
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_ul]:space-y-2
            [&_a]:text-steel [&_a]:underline hover:[&_a]:text-cyan-accent
            [&_strong]:text-foreground">
            {children}
          </article>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LegalLayout;