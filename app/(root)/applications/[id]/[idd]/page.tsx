'use client';
import { useEffect, useState } from 'react';
import { getJobApplicationsByJobId, getResumeByCandidate } from '@/server';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Briefcase, User, Calendar, Hash, Mail, FileText, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast"

// Add animation variants
const containerVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

interface Application {
  application_id: number;
  application_date: Date;
  status: string;
  job_id: number;
  candidate_id: number;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  job_title: string;
  location: string;
  experience_required: number;
  resume?: {
    resume_id: number;
    file_name: string;
    file_type: string;
    file_data: Buffer;
    uploaded_at: Date;
  };
}

export default function ApplicationDetailsPage() {
  const { id, idd } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const { data: applicationData, isLoading } = useQuery({
    queryKey: ['getJobApplicationsByJobId', id, idd],
    queryFn: () => getJobApplicationsByJobId(Number(id)),
    enabled: !!id,
  });

  const { data: resumeData } = useQuery({
    queryKey: ['getResumeByCandidate', idd],
    queryFn: () => getResumeByCandidate(Number(idd)),
    enabled: !!idd,
  });

  const handleDownloadResume = () => {
    if (resumeData?.file_data) {
      try {
        // Convert base64 to binary
        const binaryString = window.atob(resumeData.file_data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob with the correct MIME type
        const blob = new Blob([bytes.buffer], { 
          type: resumeData.file_type || 'application/pdf' 
        });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = resumeData.file_name || 'resume.pdf';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Resume downloaded successfully",
          variant: "default",
        });
      } catch (error) {
        console.error('Error downloading resume:', error);
        toast({
          title: "Failed to download resume",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"
        />
      </div>
    );
  }

  const currentApplication = applicationData?.find(app => app.candidate_id === Number(idd));

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-black"
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div 
          variants={cardVariants}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Application Details</h1>
            <p className="text-gray-400">Review candidate application information</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            className="flex items-center gap-2 hover:gap-3 transition-all text-white border-gray-700 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Button>
        </motion.div>

        {!currentApplication ? (
          <motion.div 
            variants={cardVariants}
            className="text-center text-gray-400 bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800"
          >
            No application found
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Candidate Information Card */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -5 }}
              className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Candidate Information</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Full Name</span>
                    <p className="text-white font-medium">
                      {currentApplication.candidate_first_name} {currentApplication.candidate_last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Email Address</span>
                    <p className="text-white font-medium">{currentApplication.candidate_email}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Job Information Card */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -5 }}
              className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Job Information</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Position</span>
                    <p className="text-white font-medium">{currentApplication.job_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Location</span>
                    <p className="text-white font-medium">{currentApplication.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Experience Required</span>
                    <p className="text-white font-medium">{currentApplication.experience_required} years</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Application Status Card */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -5 }}
              className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow md:col-span-2 border border-gray-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Application Status</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Application Date</span>
                    <p className="text-white font-medium">
                      {new Date(currentApplication.application_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      currentApplication.status?.toLowerCase() === 'pending'
                        ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                        : currentApplication.status?.toLowerCase() === 'accepted'
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : 'bg-red-900/50 text-red-300 border border-red-700'
                    }`}
                  >
                    {currentApplication.status?.toUpperCase() || 'PENDING'}
                  </motion.div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-400 text-sm">Application ID</span>
                    <p className="text-white font-medium">#{currentApplication.application_id}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Resume Card */}
            {resumeData && (
              <motion.div 
                variants={cardVariants}
                whileHover={{ y: -5 }}
                className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-800"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Resume</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-sm">File Name</span>
                      <p className="text-white font-medium">{resumeData.file_name}</p>
                    </div>
                    <Button
                      onClick={handleDownloadResume}
                      variant="outline"
                      className="flex items-center gap-2 hover:gap-3 transition-all text-white border-gray-700 hover:bg-gray-800"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Uploaded</span>
                    <p className="text-white font-medium">
                      {new Date(resumeData.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}