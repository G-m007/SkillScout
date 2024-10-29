'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { getJobDetails } from '@/server' // Adjust this path as needed

export default function JobApplicationPage() {
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Job Application Details</h1>

      {data && data.length > 0 ? (
        data.map((jobDetail, index) => (
          <div key={index} className="space-y-6 bg-black-100 p-6 rounded-md shadow-md mb-4">
            <div className="text-lg">
              <strong>Company Name:</strong> {jobDetail.company_name}
            </div>
            <div className="text-lg">
              <strong>Job Title:</strong> {jobDetail.job_title}
            </div>
            <div className="text-lg">
              <strong>Location:</strong> {jobDetail.location}
            </div>
            <div className="text-lg">
              <strong>Experience Required:</strong> {jobDetail.experience_required} years
            </div>
            <div className="text-lg">
              <strong>Proficiency Level Required:</strong> {jobDetail.proficiency_level_required}
            </div>
          </div>
        ))
      ) : (
        <p>No job details found for this recruiter.</p>
      )}
    </div>
  )
}
