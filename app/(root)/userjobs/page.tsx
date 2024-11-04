"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserDetails, getAppliedJobs, getAppliedJobDetails, getJobDetails } from "@/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";

interface AppliedJob {
  job_title: string;
  location: string;
  experience_required: string;
  proficiency_level_required: string;
  application_date: string;
  application_status: string;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  recruiter_company_name: string;
  recruiter_email: string;
}

interface UserDetails {
  user_id: string;
  email: string;
  // Add other user details fields if needed
}

export default function UserJobsPage() {
  const { user } = useUser()
  const { data: userDetails, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const result = await getUserDetails(user?.emailAddresses[0].emailAddress!);
      console.log("User details:", result)
      return result as UserDetails[];
    },
    enabled: !!user?.emailAddresses[0].emailAddress,
  });

  const {data: appliedJobs, isLoading} = useQuery({
    queryKey: ["applied-jobs"],
    queryFn: async () => {
        const result = await getAppliedJobDetails(userDetails?.[0]?.candidate_id)
        console.log("Applied jobs:", result)
      return result
    },
    enabled: !!userDetails?.[0]?.candidate_id
    
  })
  const { data, isLoading: appliedJobsLoading, error } = useQuery({
    queryKey: ['jobDetails'],
    queryFn: async (id) => {
      if (id) {
        console.log('ID:', id)
        const response = await getJobDetails(appliedJobs?.[0]?.job_id.toString())
        console.log("Job details:", response)
        return response;
      }
      return [];
    },
    enabled: !!appliedJobs?.[0]?.job_id,
  })
  if (userLoading || isLoading || appliedJobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">My Job Applications</h1>

      {appliedJobs && appliedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appliedJobs?.map((job) => (
            <Card key={data?.[appliedJobs.indexOf(job)]?.job_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
              
                  <Badge
                    variant={
                      job.status === "accepted"
                        ? "secondary"
                        : job.status === "rejected"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {/* {job.status.charAt(0).toUpperCase() + job.status.slice(1)} */}
                    {job.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Company:</span>
                    <span className="text-sm font-medium">{data?.[appliedJobs.indexOf(job)]?.company_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <span className="text-sm font-medium">{data?.[appliedJobs.indexOf(job)]?.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Applied on:</span>
                    <span className="text-sm font-medium">
                      {new Date(job.application_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
          <p className="text-muted-foreground">
            You haven't applied to any jobs yet. Start exploring opportunities!
          </p>
        </div>
      )}
    </div>
  );
}
