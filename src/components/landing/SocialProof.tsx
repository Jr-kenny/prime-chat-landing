import { motion } from "framer-motion";

const SocialProof = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            built on xmtp
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
