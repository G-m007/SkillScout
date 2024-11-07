'use client';
import { useEffect, useState } from 'react';
import { getJobApplicationsByJobId, getRecruiterDetails, getJobDetailsById } from '@/server';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, Building } from 'lucide-react';

interface Application {
  application_id: number;
  application_date: string;
  application_status: string;
  candidate_id: number;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  candidate_skills: string[];
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const recruiterId = searchParams.get('recruiterId');
  const {user} = useUser();
  
  const {data, isLoading} = useQuery({
    queryKey: ['getRecruiterDetails', user?.emailAddresses[0].emailAddress],
    queryFn: () => getRecruiterDetails(user?.emailAddresses[0].emailAddress!),
    enabled: !!user?.emailAddresses[0].emailAddress,
  });
  const {data: applicationData, isLoading: applicationsLoading} = useQuery({
    queryKey: ['getJobDetailsById', data?.[0].recruiter_id],
    queryFn: () => getJobDetailsById(data?.[0].recruiter_id!),
    enabled: !!data?.[0].recruiter_id,
  });
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleBack = () => {
    router.back();
  };

  

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4 bg-black">
        <div className="text-red-500">Error: {error}</div>
        <Button onClick={handleBack} variant="outline" className="text-white border-gray-700">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">View Jobs</h1>
            <p className="text-gray-400 mt-2">Manage your posted jobs</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2 hover:bg-gray-800 text-white border-gray-700"
          >
            ← Back to Homepage
          </Button>
        </div>
        
        {applicationData?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-gray-900 rounded-lg shadow-md p-8 border border-gray-800"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">No Jobs Found</h3>
              <p className="text-gray-400">You haven't posted any jobs yet.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6"
          >
            {applicationData?.map((job) => (
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -5 }}
                key={job?.job_id}
                onClick={() => router.push(`/applications/${job?.job_id}`)}
                className="bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 cursor-pointer border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">
                      {job?.job_title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-400 text-sm">
                        Posted: {new Date(job?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      job.status === 'open'
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : 'bg-red-900/50 text-red-300 border border-red-700'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}