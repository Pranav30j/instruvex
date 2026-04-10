import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

const WHATSAPP_NUMBER = "919425675330";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi I want to book a demo for Instruvex");

const StickyDemoCTA = () => {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 600);
  });

  return (
    <>
      {/* Sticky bottom bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: visible ? 0 : 100 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border glass px-4 py-3 md:hidden"
      >
        <a href="#book-demo" className="block">
          <Button variant="hero" size="sm" className="w-full gap-2">
            Book a Demo <ArrowRight size={16} />
          </Button>
        </a>
      </motion.div>

      {/* WhatsApp floating button */}
      <motion.a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: visible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-success shadow-lg transition-transform hover:scale-110 md:bottom-6"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={26} className="text-primary-foreground" />
      </motion.a>
    </>
  );
};

export default StickyDemoCTA;
