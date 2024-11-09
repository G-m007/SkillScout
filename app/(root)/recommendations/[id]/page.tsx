'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, GraduationCap, Clock } from 'lucide-react';
import { getRecommendations } from '@/server';

interface Recommendation {
  recommendation_id: number;
  job_id: number;
  candidate_id: number;
  f_name: string | null;
  l_name: string | null;
  email: string | null;
  location: string | null;
  cgpa: number | null;
  experience_years: number | null;
  skills: string[] | null;
  match_score: number;
  skill_match_score: number;
  location_match_score: number;
  experience_match_score: number;
  cgpa_match_score: number;
  created_at: string;
}

export default function RecommendationsPage() {
  const { id } = useParams();
  
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['getRecommendations', id],
    queryFn: () => getRecommendations(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Recommended Candidates</h1>
          <p className="text-gray-400 mt-2">Ranked by match score with job requirements</p>
        </div>

        <div className="grid gap-6">
          {recommendations?.map((candidate: Recommendation) => (
            <motion.div
              key={candidate.recommendation_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {candidate.f_name || ''} {candidate.l_name || ''}
                  </h3>
                  <p className="text-gray-400">{candidate.email || 'No email provided'}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-4">
                    {candidate.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">{candidate.location}</span>
                      </div>
                    )}
                    {typeof candidate.cgpa === 'number' && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          CGPA: {Number(candidate.cgpa).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {typeof candidate.experience_years === 'number' && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          {candidate.experience_years} years experience
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full bg-blue-900/50 text-blue-300 border border-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="bg-blue-900/50 px-4 py-2 rounded-full border border-blue-700">
                    <span className="text-2xl font-bold text-blue-300">
                      {Math.round(candidate.match_score)}%
                    </span>
                    <p className="text-sm text-blue-300">Overall Match</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div>Skills: {Math.round(candidate.skill_match_score)}%</div>
                    <div>Location: {Math.round(candidate.location_match_score)}%</div>
                    <div>Experience: {Math.round(candidate.experience_match_score)}%</div>
                    <div>CGPA: {Math.round(candidate.cgpa_match_score)}%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 