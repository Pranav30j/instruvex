import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Phone } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BookDemoSection = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", institute: "", phone: "", email: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.institute || !form.phone || !form.email) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: form.name,
        email: form.email,
        subject: `Demo Request – ${form.institute}`,
        message: `Institute: ${form.institute}\nPhone: ${form.phone}`,
      });
      if (error) throw error;
      toast.success("Demo request submitted! We'll contact you soon.");
      setForm({ name: "", institute: "", phone: "", email: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="book-demo" className="relative py-24 border-t border-border">
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-steel/5 blur-[150px]" />
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
              Get Started
            </span>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
              Ready to Transform{" "}
              <span className="text-gradient">Your Institute</span>?
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Book a free demo to see how Instruvex can automate your exams,
              digitize attendance, and modernize your academic operations with AI.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-steel" /> Personalized walkthrough of all features
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-steel" /> Free setup assistance for your institute
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-steel" /> No credit card required
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border bg-card-gradient p-8 shadow-card"
            >
              <h3 className="mb-6 font-display text-xl font-bold text-foreground">
                Book a Free Demo
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="demo-name">Full Name</Label>
                  <Input
                    id="demo-name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="demo-institute">Institute Name</Label>
                  <Input
                    id="demo-institute"
                    placeholder="Your school or college"
                    value={form.institute}
                    onChange={(e) => setForm({ ...form, institute: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="demo-email">Email Address</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="you@institute.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="demo-phone">Phone Number</Label>
                  <Input
                    id="demo-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Book Demo"}{" "}
                  <ArrowRight size={18} />
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookDemoSection;
