
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecruiterDetails } from "@/server";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

export default function RecruiterPage() {
  const [recruiterId, setRecruiterId] = useState<number | null>(null);
  const {user} = useUser();
  const router = useRouter();
  const {data, isLoading} = useQuery({
    queryKey: ['getRecruiterDetails', user?.emailAddresses[0].emailAddress],
    queryFn: () => getRecruiterDetails(user?.emailAddresses[0].emailAddress!),
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Recruiter Portal
          </h1>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Button 
              onClick={() => router.push("/create")} 
              variant="outline"
              className="w-full py-6 text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Create a New Job
            </Button>
            <Button 
              onClick={() => router.push(`/applications?recruiterId=${data?.[0].recruiter_id}`)}
              variant="outline"
              className="w-full py-6 text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Inbox className="w-5 h-5" />
              View Applications
            </Button>
          </div>

          {/* Welcome Section */}
          <div className="text-center space-y-4 bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Welcome to Your Recruiter Dashboard
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Manage your job postings and review applications efficiently. 
              Post new opportunities and find the perfect candidates for your organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
