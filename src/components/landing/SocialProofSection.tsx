import { motion } from "framer-motion";
import { Star, Building2, Users, FileText } from "lucide-react";

const metrics = [
  { icon: Building2, value: "50+", label: "Institutes Onboarded" },
  { icon: Users, value: "10,000+", label: "Students Managed" },
  { icon: FileText, value: "25,000+", label: "Exams Conducted" },
  { icon: Star, value: "4.8/5", label: "Satisfaction Rating" },
];

const SocialProofSection = () => (
  <section className="relative py-24 border-t border-border">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
          Trusted Platform
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
          Trusted by Growing Institutes{" "}
          <span className="text-gradient">Across India</span>
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Schools, colleges, and coaching centers rely on Instruvex to modernize their academic operations.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card-gradient p-6 text-center shadow-card"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-steel/10">
              <m.icon size={22} className="text-steel" />
            </div>
            <div className="mb-1 font-display text-3xl font-bold text-foreground">
              {m.value}
            </div>
            <div className="text-sm text-muted-foreground">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofSection;
