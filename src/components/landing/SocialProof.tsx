import { motion } from "framer-motion";
import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const SocialProof = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            built on xmtp
          </p>
          
          <a 
            href="https://x.com/Jrken_ny" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" className="h-10 w-10 mt-2">
              <Twitter className="h-5 w-5" />
            </Button>
          </a>
          
          <p className="text-xs text-muted-foreground pt-2">
            a product of prime isles
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
