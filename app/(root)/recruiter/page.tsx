"use client";

import { useRouter } from "next/navigation"; // Use next/navigation instead of next/router
import { Button } from "@/components/ui/button";

export default function RecruiterPage() {
  const router = useRouter(); // Correct usage from next/navigation

  const handleRecruiterClick = () => {
    router.push("/create"); // Navigate to /create page
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Recruiter Portal</h1>
      <Button onClick={handleRecruiterClick} variant="outline">
        Create a New Job
      </Button>
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold mb-4">Recruiter Home Page</h1>
        <p>Welcome to the Recruiter section. Explore job opportunities here.</p>
        </div>
    </div>
  );
}
