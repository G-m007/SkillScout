"use client";

import { useRouter } from "next/navigation"; // Use next/navigation for routing
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getDetails } from "@/server";
import { Loader2 } from "lucide-react";
import { PlusCircle, Search, Briefcase } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Candidate Portal
          </h1>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Button 
              onClick={handleViewJobsClick} 
              variant="outline"
              className="w-full py-6 text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              View Available Jobs
            </Button>
            <Button 
              onClick={handleYourJobsClick} 
              variant="outline"
              className="w-full py-6 text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Briefcase className="w-5 h-5" />
              Your Jobs
            </Button>
          </div>

          {/* Welcome Section */}
          <div className="text-center space-y-4 mt-8 bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Welcome to Your Dashboard
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore job opportunities and manage your applications all in one place. 
              Start your journey to finding your dream job today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


      
    



    
