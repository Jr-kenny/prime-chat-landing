import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">prime chat</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Platform
          </Link>
          <Link
            to="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Use Cases
          </Link>
          <Link
            to="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Learn
          </Link>
        </div>

        <Link to="/welcome">
          <Button
            size="sm"
            className="rounded-full px-6 font-medium"
          >
            enter
          </Button>
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
