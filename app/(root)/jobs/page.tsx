"use client";

import { useQuery } from "@tanstack/react-query";
import { getDetails } from "@/server";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

  // Display loader while data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">Recruiter Listings</h1>

      {/* List Recruiters */}
      <div className="space-y-4 w-full max-w-4xl mx-auto">
        {data && data.length > 0 ? (
          data.map((recruiter: any, index: number) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-600 rounded-md shadow-md space-y-4 sm:space-y-0"
            >
              {/* Recruiter Name */}
              <div className="w-full sm:w-1/4 text-center">
                <strong>Recruiter Name:</strong> <br />
                {recruiter.name ?? "N/A"}
              </div>

              {/* Email */}
              <div className="w-full sm:w-1/4 text-center">
                <strong>Email:</strong> <br />
                {recruiter.email ?? "N/A"}
              </div>

              {/* Company Name */}
              <div className="w-full sm:w-1/4 text-center">
                <strong>Company Name:</strong> <br />
                {recruiter.company_name ?? "N/A"}
              </div>

              {/* Button */}
              <div className="w-full sm:w-1/4 text-center">
                <button
                  onClick={() => handleApplyClick(recruiter.recruiter_id)}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 w-full sm:w-auto"
                >
                  Apply
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg">No recruiters found.</p>
        )}
      </div>
    </div>
  );
}
