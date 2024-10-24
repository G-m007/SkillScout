"use client";

import { useRouter } from "next/navigation"; // Use next/navigation for routing
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getDetails } from "@/server";
import { Loader2 } from "lucide-react";

export default function CandidatePage() {
  const router = useRouter(); // Correct routing hook from next/navigation

  const handleViewJobsClick = () => {
    router.push("/jobs"); // Navigate to /jobs page
  };

  const handleYourJobsClick = () => {
    router.push("/userjobs"); // Navigate to /userjobs page
  };
  ////////////////////////////////////////////////////
  const {data, isLoading} = useQuery({
    queryKey: ['cand'],
    queryFn: async () => {
      try {
        const response = getDetails();
        return response
        console.log(data)
      } catch (error) {
        console.log(error)
      }
    }
  })
  if (isLoading) {
    return <Loader2 width={20} height={20} className="object-cover" />
  }
  /////////////////////////////////////////////
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Candidate Portal</h1>
      <div className="space-y-4">
        <Button onClick={handleViewJobsClick} variant="outline">
          View Available Jobs
        </Button>
        <Button onClick={handleYourJobsClick} variant="outline">
          Your Jobs
        </Button>
        <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold mb-4">Candidate Home Page</h1>
        <p>Welcome to the candidate section. Explore job opportunities here.</p>
        </div>




      </div>
    </div>
  );
}


      
    



    
