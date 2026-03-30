import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center w-full">
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,58,237,0.3)]"
      >
        <Activity className="w-8 h-8 text-primary" />
      </motion.div>
      <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};
