import Link from "next/link";
import { User } from "@clerk/nextjs/server";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Sparkles, UserCircle } from "lucide-react";

export default function AppPage({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      <main className="container mx-auto flex-grow flex items-center justify-center py-16 px-4">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                Welcome to SkillScout
              </h1>
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Your gateway to exciting career opportunities
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {/* Candidate Card */}
            <Link href="/candidate">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-card hover:bg-card/80 p-8 rounded-xl shadow-lg transition-all duration-300 border border-border"
              >
                <div className="flex flex-col items-center space-y-4">
                  <UserCircle className="w-12 h-12 text-primary group-hover:text-primary/80 transition-colors" />
                  <h2 className="text-2xl font-semibold">Candidate</h2>
                  <p className="text-muted-foreground">Find your dream job</p>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-2 transition-all" />
                </div>
              </motion.div>
            </Link>

            {/* Recruiter Card */}
            <Link href="/recruiter">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-card hover:bg-card/80 p-8 rounded-xl shadow-lg transition-all duration-300 border border-border"
              >
                <div className="flex flex-col items-center space-y-4">
                  <Building2 className="w-12 h-12 text-primary group-hover:text-primary/80 transition-colors" />
                  <h2 className="text-2xl font-semibold">Recruiter</h2>
                  <p className="text-muted-foreground">Post jobs & find talent</p>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-2 transition-all" />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
