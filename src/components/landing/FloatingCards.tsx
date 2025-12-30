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
      // Positioned ~20px left of the phone (card width 200px + 20px gap)
      position: "left-[-220px] top-[18%]",
      delay: 0.6,
    },
    {
      id: 2,
      title: "Familiar Experience",
      description: "Chat like you're used to",
      icon: MessageSquare,
      color: "bg-accent-orange",
      // Positioned ~20px right of the phone
      position: "left-[calc(100%_+_20px)] top-[18%]",
      delay: 0.7,
    },
    {
      id: 3,
      title: "ENS & Lens Detection",
      description: "Auto-resolve web3 profiles",
      icon: Link2,
      color: "bg-secondary",
      // Positioned ~20px left of the phone at lower half
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
      // Positioned ~20px right of the phone at lower half
      position: "left-[calc(100%_+_20px)] bottom-[14%] md:bottom-[16%]",
      delay: 0.9,
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: card.delay }}
          // Ensure z-index is high enough to sit near/over the mockup edges if they overlap
          className={`absolute ${card.position} hidden md:block z-40`}
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
                <h4 className={`font-semibold text-sm text-foreground leading-normal`}>{card.title}</h4>
                <p className={`text-sm text-foreground/70 mt-1 break-words`}>{card.description}</p>
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
    </>
  );
};

export default FloatingCards;