"use client";

import { useQuery } from "@tanstack/react-query";
import { getDetails } from "@/server";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, User, Mail, ArrowRight, Briefcase } from "lucide-react";

export default function RecruiterPage() {
  // Fetch recruiter data using react-query
  const router = useRouter();

  const handleApplyClick = (id: string) => {
    router.push(`/jobs/${id}`); // Navigate to the job details page with the recruiter's ID
  };
  const { data, isLoading } = useQuery({
    queryKey: ["recruiters"],
    queryFn: async () => {
      try {
        const response = await getDetails(); // Function to fetch recruiter details
        return response;
      } catch (error) {
        console.error(error);
      }
    },
  });

  if (isLoading) {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Available Positions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Explore opportunities from top recruiters
          </p>
        </div>

        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((recruiter: any, index: number) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {recruiter.company_name ?? "N/A"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{recruiter.name ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{recruiter.email ?? "N/A"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => handleApplyClick(recruiter.recruiter_id)}
                      className="w-full group"
                    >
                      View Positions
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              No Recruiters Available
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              There are currently no recruiters listed. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
