import Link from "next/link";
import { User } from "@clerk/nextjs/server";

export default function AppPage({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow flex items-center justify-center bg-white"> {/* Set background to white */}
        {/* Hero Section */}
        <section className="text-primary-foreground py-20 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to SkillScout
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            A job marketplace to find jobs
          </p>
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Candidate Button */}
            <Link
              href="/candidate"
              className="bg-background text-primary hover:bg-background/90 px-12 py-4 md:px-20 md:py-8 rounded-md font-semibold transition-colors duration-200 text-lg md:text-xl"
            >
              Candidate
            </Link>

            {/* Recruiter Button */}
            <Link
              href="/recruiter"
              className="bg-background text-primary hover:bg-background/90 px-12 py-4 md:px-20 md:py-8 rounded-md font-semibold transition-colors duration-200 text-lg md:text-xl"
            >
              Recruiter
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
