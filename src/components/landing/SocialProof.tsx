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
          className="text-center space-y-4"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            built on xmtp
          </p>
          
          {/* X (Twitter) Button */}
          <a
            href="https://x.com/Jrken_ny"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="h-4 w-4 fill-current"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-medium">@Jrken_ny</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
