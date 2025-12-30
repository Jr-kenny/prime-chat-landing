import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Shield, Zap } from "lucide-react";

const Welcome = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate("/chat");
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight">prime chat</span>
          </Link>
        </motion.div>

        {/* Welcome Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
        >
          Welcome to Prime Chat
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-muted-foreground mb-10"
        >
          Connect your wallet to start secure, decentralized messaging
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center gap-8 mb-10"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-accent/10">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Encrypted</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-accent-orange/10">
              <MessageCircle className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Decentralized</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-accent-purple/10">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Fast</span>
          </div>
        </motion.div>

        {/* Connect Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center"
        >
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus || authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    return null;
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8"
        >
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;
