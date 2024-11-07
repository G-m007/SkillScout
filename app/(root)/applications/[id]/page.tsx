'use client';
import { useEffect, useState } from 'react';
import { getJobApplicationsByJobId, getRecruiterDetails, getJobDetailsById } from '@/server';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { User, Briefcase, Calendar, Mail, Phone } from 'lucide-react';

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
  const {id} = useParams();
  const {data, isLoading} = useQuery({
    queryKey: ['getRecruiterDetails', user?.emailAddresses[0].emailAddress],
    queryFn: () => getRecruiterDetails(user?.emailAddresses[0].emailAddress!),
    enabled: !!user?.emailAddresses[0].emailAddress,
  });   
  const {data: applicationData, isLoading: applicationsLoading} = useQuery({
    queryKey: ['getJobApplicationsByJobId', id],
    queryFn: () => getJobApplicationsByJobId(Number(id)),
    enabled: !!id,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleBack = () => {
    router.back();
  };

  

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="text-red-500">Error: {error}</div>
        <Button onClick={handleBack} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  // Add animation variants
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

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Applications</h1>
            <p className="text-gray-400 mt-2">Manage your job applications</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2 hover:bg-gray-800 text-white border-gray-700"
          >
            ← Back to View Jobs
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
              <h3 className="text-xl font-semibold text-white">No Applications Found</h3>
              <p className="text-gray-400">There are currently no applications for this position.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2"
          >
            {applicationData?.map((application, index) => (
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -5 }}
                key={application?.application_id}
                onClick={() => router.push(`/applications/${applicationData?.[0].job_id}/${application?.candidate_id}`)}
                className="bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 cursor-pointer border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-300">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">
                      {application?.candidate_first_name} {application?.candidate_last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-400 text-sm">{application?.candidate_email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        Applied: {new Date(application?.application_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        application?.status === 'pending'
                          ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                          : application?.status === 'accepted'
                          ? 'bg-green-900/50 text-green-300 border border-green-700'
                          : 'bg-red-900/50 text-red-300 border border-red-700'
                      }`}>
                        {application?.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {application?.candidate_skills?.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {application.candidate_skills.map((skill: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full border border-blue-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}