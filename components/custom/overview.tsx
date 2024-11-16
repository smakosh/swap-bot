import { motion } from 'framer-motion';

import { MessageIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <MessageIcon size={32} />
        </p>
        <h1 className="text-3xl font-bold">
          Your AI Co-Pilot for Smarter Crypto Management
        </h1>
        <p>
          DeFi Pilot simplifies portfolio tracking and empowers 1inch users with
          actionable insights, performance analytics, and personalized
          strategies. Manage your DeFi assets effortlessly with a secure,
          intuitive assistant designed to help you navigate the crypto universe
          like a pro. 🚀
        </p>
      </div>
    </motion.div>
  );
};
