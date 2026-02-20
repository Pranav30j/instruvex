import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "For individual instructors",
    features: [
      "Up to 50 students",
      "Basic exam creation",
      "MCQ auto-grading",
      "Standard analytics",
      "Community support",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/mo",
    desc: "For growing institutions",
    features: [
      "Up to 500 students",
      "AI question generation",
      "Full auto-evaluation",
      "Advanced analytics",
      "Academy access",
      "Certification engine",
      "Priority support",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For large organizations",
    features: [
      "Unlimited students",
      "Multi-tenant isolation",
      "Custom integrations",
      "White-label options",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const PricingSection = () => (
  <section id="pricing" className="relative py-24">
    <div className="pointer-events-none absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-steel/5 blur-[150px]" />
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
          Pricing
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
          Plans That <span className="text-gradient">Scale</span>
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Start free and upgrade as your institution grows.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-xl border p-8 shadow-card transition-all duration-300 ${
              plan.featured
                ? "border-steel/40 bg-card-gradient shadow-glow"
                : "border-border bg-card-gradient hover:border-steel/20"
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-steel to-cyan-accent px-4 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </div>
            )}
            <h3 className="mb-1 font-display text-xl font-bold text-foreground">
              {plan.name}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">{plan.desc}</p>
            <div className="mb-6">
              <span className="font-display text-4xl font-bold text-foreground">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-muted-foreground">{plan.period}</span>
              )}
            </div>
            <ul className="mb-8 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={16} className="shrink-0 text-steel" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button
                variant={plan.featured ? "hero" : "hero-outline"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
