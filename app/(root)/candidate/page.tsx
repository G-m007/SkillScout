"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getUserDetails } from "@/server";
import { Loader2, Search, Briefcase, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function CandidatePage() {
  const router = useRouter();
  const { user } = useUser();
  const [showDialog, setShowDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['getCandidateDetails', user?.emailAddresses[0]?.emailAddress],
    queryFn: () => getUserDetails(user?.emailAddresses[0]?.emailAddress!),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  const handleViewJobsClick = () => {
    if (!data?.[0]?.candidate_id) {
      setShowDialog(true);
      return;
    }
    router.push("/jobs");
  };

  const handleYourJobsClick = () => {
    if (!data?.[0]?.candidate_id) {
      setShowDialog(true);
      return;
    }
    router.push("/userjobs");
  };

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Restricted
            </DialogTitle>
            <DialogDescription>
              You are not authorized to access this page. Please complete your candidate profile first.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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


      
    



    

