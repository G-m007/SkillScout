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
import { Loader2, X, Upload } from "lucide-react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getUserDetails, getCandidateWithSkills, updateCandidateDetails } from "@/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useClerk } from "@clerk/nextjs";

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
      phone_number: userData.phone_number,
      date_of_birth: userData.date_of_birth,
      location: userData.location,
      cgpa: userData.cgpa,
      skills: userData.skills,
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

  if (isLoading || userdataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8">
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
                <Label>Resume Upload</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="flex-1"
                    disabled={!isEditing || isUploading}
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={!isEditing || isUploading}
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
    </div>
  );
}