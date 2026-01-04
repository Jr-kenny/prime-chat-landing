import { motion } from "framer-motion";
import { Wallet, MessageSquare, Link2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingCards = () => {
  const cards = [
    {
      id: 1,
      title: "Wallet-Native Identity",
      description: "Your wallet is your identity",
      icon: Wallet,
      color: "bg-accent",
      position: "left-[-220px] top-[18%]",
      delay: 0.6,
    },
    {
      id: 2,
      title: "Familiar Experience",
      description: "Chat like you're used to",
      icon: MessageSquare,
      color: "bg-accent-orange",
      position: "left-[calc(100%_+_20px)] top-[18%]",
      delay: 0.7,
    },
    {
      id: 3,
      title: "ENS & Lens Detection",
      description: "Auto-resolve web3 profiles",
      icon: Link2,
      color: "bg-secondary",
      position: "left-[-220px] bottom-[14%] md:bottom-[16%]",
      delay: 0.8,
      hasAction: true,
    },
    {
      id: 4,
      title: "Secured by XMTP",
      description: "Every message is encrypted",
      icon: Shield,
      color: "bg-accent-purple",
      position: "left-[calc(100%_+_20px)] bottom-[14%] md:bottom-[16%]",
      delay: 0.9,
    },
  ];

  return (
    <>
      {/* Desktop: Floating cards around phone */}
      {cards.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: card.delay }}
          className={`absolute ${card.position} hidden lg:block z-40`}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
            className={`${card.color} rounded-2xl p-4 w-[240px] shadow-xl border border-white/10`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-foreground/10 rounded-lg">
                <card.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground leading-normal">{card.title}</h4>
                <p className="text-sm text-foreground/70 mt-1 break-words">{card.description}</p>
                {card.hasAction && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3 h-7 text-[10px] px-3 rounded-full bg-white/20 hover:bg-white/40 border-none"
                  >
                    Copy Share Link
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Mobile: Cards in a horizontal scroll or grid below phone */}
      <div className="lg:hidden mt-8 w-screen -ml-[50vw] left-1/2 relative px-4">
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {cards.map((card, index) => (
            <motion.div
              key={`mobile-${card.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="snap-center shrink-0 first:ml-auto last:mr-auto"
            >
              <div className={`${card.color} rounded-xl p-3 w-[200px] shadow-lg border border-white/10`}>
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-foreground/10 rounded-lg shrink-0">
                    <card.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-foreground leading-tight">{card.title}</h4>
                    <p className="text-xs text-foreground/70 mt-0.5">{card.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FloatingCards;
