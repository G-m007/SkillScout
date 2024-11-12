"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Upload, PlusCircle, FileText, Download } from "lucide-react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getUserDetails, getCandidateWithSkills, updateCandidateDetails, getResumeByCandidate } from "@/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useClerk } from "@clerk/nextjs";
import { getRecruiterDetails, getJobDetailsById } from "@/server";

// Mock available skills (replace with actual skill data in your app)
const availableSkills = [
  "React",
  "Node.js",
  "MongoDB",
  "Python",
  "Java",
  "JavaScript",
  "Machine Learning",
  "SQL",
  "Figma",
  "Adobe XD",
  "Sketch",
  "Web Scraping",
  "Data Analysis",
  "Mobile Development",
  "React Native",
  "Backend Development",
];

// Update the interface to match candidate structure
interface CandidateWithSkills {
  candidate_id: number;
  f_name: string;
  l_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  location: string;
  cgpa: string;
  skills: string[];
}

interface ResumeUploadResponse {
  success: boolean;
  message: string;
}

// Update the interface to match all required parameters
interface UpdateCandidateParams {
  candidateId: number;
  firstName: string;
  lastName: string;
  phone_number: string;
  date_of_birth: string;
  location: string;
  cgpa: string;
  skills: string[];
}

interface RecruiterDetails {
  recruiter_id: number;
  f_name: string;
  l_name: string;
  company_name: string;
  email: string;
}

interface JobListing {
  job_id: number;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  posted_date: string;
  status: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [userData, setUserData] = useState<CandidateWithSkills | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const { user } = useUser();
  const { data, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      if (!user?.emailAddresses[0]?.emailAddress) return null;
      const result = await getUserDetails(user.emailAddresses[0].emailAddress);
      return result;
    },
    enabled: !!user?.emailAddresses[0]?.emailAddress,
  });
  const { data: userdata, isLoading: userdataLoading } = useQuery({
    queryKey: ["userdata"],
    queryFn: async () => {
      if (!data?.[0]?.candidate_id) return null;
      const result = await getCandidateWithSkills(data[0].candidate_id);
      if (result?.[0]) setUserData(result[0] as CandidateWithSkills);
      return result?.[0];
    },
    enabled: !!data?.[0]?.candidate_id,
  });
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { signOut } = useClerk();
  const [isRecruiter, setIsRecruiter] = useState(false);

  // Get recruiter details
  const { data: recruiterData } = useQuery({
    queryKey: ["recruiterDetails"],
    queryFn: async () => {
      if (!user?.emailAddresses[0]?.emailAddress) return null;
      const result = await getRecruiterDetails(user.emailAddresses[0]?.emailAddress);
      if (result?.[0]) {
        setIsRecruiter(true);
        return result[0];
      }
      return null;
    },
    enabled: !!user?.emailAddresses[0]?.emailAddress,
  });

  // Get recruiter's job listings
  const { data: jobListings } = useQuery({
    queryKey: ["recruiterJobs", recruiterData?.recruiter_id],
    queryFn: async () => {
      if (!recruiterData?.recruiter_id) return null;
      return await getJobDetailsById(recruiterData.recruiter_id);
    },
    enabled: !!recruiterData?.recruiter_id,
  });

  const updateUserMutation = useMutation({
    mutationFn: (params: UpdateCandidateParams) => updateCandidateDetails(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userdata"] });
      toast({
        title: "Profile updated successfully",
        variant: "default",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    },
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for CGPA
    if (name === 'cgpa') {
      const cgpaValue = parseFloat(value);
      if (cgpaValue < 0 || cgpaValue > 10) {
        toast({
          title: "Invalid CGPA",
          description: "CGPA must be between 0 and 10",
          variant: "destructive",
        });
        return;
      }
    }

    setUserData((prev) => prev ? { ...prev, [name]: value } : undefined);
  };

  const handleAddSkill = () => {
    if (selectedSkill && userData && !userData.skills.includes(selectedSkill)) {
      setUserData({
        ...userData,
        skills: [...userData.skills, selectedSkill],
      });
      setSelectedSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (userData) {
      setUserData({
        ...userData,
        skills: userData.skills.filter((skill) => skill !== skillToRemove),
      });
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    updateUserMutation.mutate({
      candidateId: userData.candidate_id,
      firstName: userData.f_name,
      lastName: userData.l_name,
      phone_number: userData.phone_number || '',
      date_of_birth: userData.date_of_birth || '',
      location: userData.location || '',
      cgpa: userData.cgpa || '0',
      skills: userData.skills || [],
    });
  };

  const uploadResumeMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<ResumeUploadResponse> => {
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resume uploaded successfully",
        variant: "default",
      });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload resume",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error("Error uploading resume:", error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userData?.candidate_id) return;

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('candidateId', userData.candidate_id.toString());

    uploadResumeMutation.mutate(formData);
  };

  const { data: resumeData } = useQuery({
    queryKey: ["resume", userData?.candidate_id],
    queryFn: async () => {
      if (!userData?.candidate_id) return null;
      return await getResumeByCandidate(userData.candidate_id);
    },
    enabled: !!userData?.candidate_id,
  });

  if (isLoading || userdataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {isRecruiter ? (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold">
                    {recruiterData?.f_name} {recruiterData?.l_name}
                  </CardTitle>
                  <CardDescription className="text-lg mt-1">
                    <span className="font-medium text-primary">
                      {recruiterData?.company_name}
                    </span>
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                  <Button 
                    onClick={() => window.location.href = '/jobs/create'}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle size={20} />
                    Post New Job
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Job Listings Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 px-1">Your Job Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobListings?.length === 0 ? (
                <Card className="col-span-full p-8">
                  <div className="text-center text-muted-foreground">
                    <p>No job listings yet.</p>
                    <Button 
                      variant="link" 
                      onClick={() => window.location.href = '/jobs/create'}
                      className="mt-2"
                    >
                      Create your first job posting
                    </Button>
                  </div>
                </Card>
              ) : (
                jobListings?.map((job) => (
                  <Card 
                    key={job.job_id} 
                    className="hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardHeader>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-lg leading-tight">
                            {job.job_title}
                          </CardTitle>
                          <Badge 
                            variant={job.current_status === 'open' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {job.current_status}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start px-2 hover:bg-secondary"
                          onClick={() => window.location.href = `/jobs/${job.job_id}`}
                        >
                          View Details →
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Optional: Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Jobs</CardTitle>
                <CardDescription className="text-2xl font-bold text-primary">
                  {jobListings?.filter(job => job.current_status === 'open').length || 0}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Closed Jobs</CardTitle>
                <CardDescription className="text-2xl font-bold text-muted-foreground">
                  {jobListings?.filter(job => job.current_status === 'closed').length || 0}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Jobs</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {jobListings?.length || 0}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              View and edit your profile information (ID: {userData?.candidate_id})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="f_name">First Name</Label>
                  <Input
                    id="f_name"
                    name="f_name"
                    value={userData?.f_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l_name">Last Name</Label>
                  <Input
                    id="l_name"
                    name="l_name"
                    value={userData?.l_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA</Label>
                  <Input
                    id="cgpa"
                    name="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={userData?.cgpa || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your CGPA (0-10)"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {userData?.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-sm">
                        {skill}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Select
                        value={selectedSkill}
                        onValueChange={setSelectedSkill}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSkills.map((skill) => (
                            <SelectItem key={skill} value={skill}>
                              {skill}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={handleAddSkill}>
                        Add Skill
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Resume</Label>
                  <Card className="p-4">
                    <div className="space-y-4">
                      {/* Current Resume Display */}
                      {resumeData && (
                        <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{resumeData.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded on: {new Date(resumeData.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const byteCharacters = atob(resumeData.file_data);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: resumeData.file_type });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = resumeData.file_name;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      )}

                      {/* Resume Upload Section */}
                      <div className="space-y-2">
                        {isEditing && (
                          <>
                            <div className="flex items-center gap-4">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="flex-1"
                                disabled={isUploading}
                              />
                              {selectedFile && (
                                <Button
                                  type="button"
                                  onClick={handleUpload}
                                  disabled={isUploading}
                                  className="flex items-center gap-2"
                                >
                                  {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  Upload
                                </Button>
                              )}
                            </div>
                            {selectedFile && (
                              <p className="text-sm text-muted-foreground">
                                Selected file: {selectedFile.name}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button type="submit" onClick={handleSubmit}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
            <Button variant="destructive" onClick={() => signOut()}>
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}