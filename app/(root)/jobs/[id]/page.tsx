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
      await createJobApplication(selectedJob.job_id, currentUser?.[0]?.candidate_id, selectedJob.recruiter_id)
    }
  })
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
          <div key={index} className="space-y-4 bg-black-100 p-4 sm:p-6 rounded-md shadow-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-base sm:text-lg">
                <strong>Company Name:</strong> {jobDetail.company_name}
              </div>
              <div className="text-base sm:text-lg">
                <strong>Job Title:</strong> {jobDetail.job_title}
              </div>
              <div className="text-base sm:text-lg">
                <strong>Location:</strong> {jobDetail.location}
              </div>
              <div className="text-base sm:text-lg">
                <strong>Experience Required:</strong> {jobDetail.experience_required} years
              </div>
              <div className="text-base sm:text-lg">
                <strong>Proficiency Level Required:</strong> {jobDetail.proficiency_level_required}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => handleApply(jobDetail)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply Now
              </Button>
            </div>
          </div>
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
