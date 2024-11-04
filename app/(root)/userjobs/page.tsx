'use client';

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserDetails, getAppliedJobDetails } from "@/server";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function UserJobsPage() {
  const { user } = useUser();
  const { data: userDetails, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const result = await getUserDetails(user?.emailAddresses[0].emailAddress!);
      return result;
    },
    enabled: !!user?.emailAddresses[0].emailAddress,
  });

  const { data: appliedJobs, isLoading } = useQuery({
    queryKey: ["applied-jobs"],
    queryFn: async () => {
      const result = await getAppliedJobDetails(userDetails?.[0]?.candidate_id);
      console.log("Applied jobs:", result);
      return result;
    },
    enabled: !!userDetails?.[0]?.candidate_id,
  });

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage your job applications
          </p>
        </div>

        {appliedJobs && appliedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appliedJobs.map((job) => (
              <Card 
                key={`${job.job_id}-${job.application_date}`} 
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
              >
                <CardHeader className="space-y-4">
                  <div className="space-y-2">
                    <CardTitle className="text-xl line-clamp-2">
                      {job.job_title || 'Job Title Not Available'}
                    </CardTitle>
                    <Badge
                      className="text-xs px-3 py-1"
                      variant={
                        job.status === "accepted"
                          ? "success"
                          : job.status === "rejected"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {(job.status || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{job.job_location || 'Location Not Specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Applied {new Date(job.application_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">No Applications Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              You haven't applied to any jobs yet. Start exploring opportunities!
            </p>
            <Button>
              Browse Jobs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}