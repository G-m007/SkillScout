'use client'

import { useParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { createJobApplication, getJobDetails, getUserDetails } from '@/server'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent } from "@/components/ui/card"
import { Building2, MapPin, Clock, Briefcase, GraduationCap } from "lucide-react"

export default function JobApplicationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const {user } = useUser()
  const params = useParams()  // Log params to check if 'id' is present
  const id = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobDetails'],
    queryFn: async (id) => {
      if (id) {
        console.log('ID:', id)
        const response = await getJobDetails(params.id.toString())
        return response;
      }
      return [];
    },
    enabled: !!id,
  })

  const handleApply = (jobDetail: any) => {
    setSelectedJob(jobDetail)
    setIsDialogOpen(true)
  }
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await getUserDetails(user?.emailAddresses[0].emailAddress!)
      console.log("Current User:",response)
      return response
    },
    enabled: !!user?.emailAddresses[0].emailAddress,
  })
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await createJobApplication(selectedJob.job_id, currentUser?.[0]?.candidate_id, selectedJob.recruiter_id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setIsConfirmed(false);
      setSelectedJob(null);
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  const handleConfirmApply = async () => {
    if (!isConfirmed) {
      return
    }
    try {
      // Store the job application in your backend/database
      await mutation.mutate()
      setIsDialogOpen(false)
      
      // Show success message (you might want to add a toast notification here)
        
      // Reset state
    
      setIsConfirmed(false)
      setSelectedJob(null)
    } catch (error) {
      console.error('Error applying for job:', error)
      // Show error message to user (you might want to add a toast notification here)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto py-8">Error fetching job details: {(error as Error).message}</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-4">Job Application Details</h1>

      {data && data.length > 0 ? (
        data.map((jobDetail, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 mb-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{jobDetail.company_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                  <span>{jobDetail.job_title}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{jobDetail.location}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>{jobDetail.experience_required} years experience required</span>
                </div>

                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <span>Minimum CGPA: {jobDetail.min_cgpa}</span>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => handleApply(jobDetail)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p>No job details found for this recruiter.</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply for this position at {selectedJob?.company_name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm that I want to apply for this position
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isConfirmed}
              onClick={handleConfirmApply}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
