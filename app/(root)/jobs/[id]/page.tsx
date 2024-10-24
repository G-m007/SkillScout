"use client";

import { useRouter } from "next/router"; // Use next/router for routing
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getJobDetails } from "@/server"; // Import the function to fetch job details

export default function JobApplicationPage() {
  const router = useRouter();
  const { id } = router.query; // Get the recruiter ID from the URL

  // Fetch job details based on the recruiter ID
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobDetails", id],
    queryFn: async () => {
      if (id) {
        const response = await getJobDetails(); // Call the function with the recruiter ID
        return response;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return <div>Error fetching job details: {error.message}</div>;
  }

  // Render the job application details
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Job Application Details</h1>

      {data && data.length > 0 ? (
        data.map((jobDetail: any, index: number) => (
          <div key={index} className="space-y-6 bg-gray-100 p-6 rounded-md shadow-md">
            {/* Company Name */}
            <div className="text-lg">
              <strong>Company Name:</strong> {jobDetail.company_name}
            </div>

            {/* Job Title */}
            <div className="text-lg">
              <strong>Job Title:</strong> {jobDetail.job_title}
            </div>

            {/* Job Location */}
            <div className="text-lg">
              <strong>Location:</strong> {jobDetail.location}
            </div>

            {/* Experience Required */}
            <div className="text-lg">
              <strong>Experience Required:</strong> {jobDetail.experience_required} years
            </div>

            {/* Proficiency Level Required */}
            <div className="text-lg">
              <strong>Proficiency Level Required:</strong> {jobDetail.proficiency_level_required}
            </div>
          </div>
        ))
      ) : (
        <p>No job details found for this recruiter.</p>
      )}
    </div>
  );
}
