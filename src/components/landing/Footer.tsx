import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Instruvex ERP", href: "/#features" },
    { label: "Instruvex Exams", href: "/#features" },
    { label: "Instruvex Academy", href: "/#academy" },
    { label: "Pricing", href: "/#pricing" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Verify Certificate", href: "/verify" },
    { label: "Book a Demo", href: "/#book-demo" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const Footer = () => (
  <footer className="border-t border-border bg-navy-deep py-16">
    <div className="container mx-auto px-4">
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-steel to-cyan-accent">
              <span className="font-display text-xs font-bold text-primary-foreground">IX</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              Instruvex
            </span>
          </Link>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            AI-powered ERP and exam platform for schools, colleges, and educational institutes across India.
          </p>
          <p className="text-xs text-muted-foreground">
            Transforming education with intelligent technology.
          </p>
        </div>
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              {title}
            </h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Instruvex. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
