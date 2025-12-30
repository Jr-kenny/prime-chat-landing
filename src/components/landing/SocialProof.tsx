import { motion } from "framer-motion";

const brands = [
  "VELORA",
  "NORTHWAVE",
  "BLUMER",
  "SKINNIFY",
  "PUREDROP",
  "LUXORA",
  "THREADLINE",
  "URBAN PEAK",
];

const SocialProof = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            built on xmtp
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-12"
        >
          {brands.map((brand, index) => (
            <motion.span
              key={brand}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              viewport={{ once: true }}
              className="text-sm md:text-base font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default"
            >
              {brand}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
