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
      side: "left" as const,
      verticalOffset: "-60px",
      delay: 0.6,
    },
    {
      id: 2,
      title: "Familiar Experience",
      description: "Chat like you're used to",
      icon: MessageSquare,
      color: "bg-accent-orange",
      side: "right" as const,
      verticalOffset: "-20px",
      delay: 0.7,
    },
    {
      id: 3,
      title: "ENS & Lens Detection",
      description: "Auto-resolve web3 profiles",
      icon: Link2,
      color: "bg-secondary",
      side: "left" as const,
      verticalOffset: "100px",
      delay: 0.8,
      hasAction: true,
    },
    {
      id: 4,
      title: "Secured by XMTP",
      description: "Every message is encrypted",
      icon: Shield,
      color: "bg-accent-purple",
      side: "right" as const,
      verticalOffset: "140px",
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
          className="absolute hidden lg:block"
          style={{
            top: `calc(50% + ${card.verticalOffset})`,
            transform: 'translateY(-50%)',
            ...(card.side === 'left' 
              ? { right: 'calc(50% + 140px)' }
              : { left: 'calc(50% + 140px)' }
            ),
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
            className={`${card.color} rounded-2xl p-4 shadow-lg max-w-[200px]`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-foreground/10 rounded-lg">
                <card.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{card.title}</h4>
                <p className="text-xs text-foreground/70 mt-0.5">{card.description}</p>
                {card.hasAction && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 h-7 text-xs rounded-full"
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
