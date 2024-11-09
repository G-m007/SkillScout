"use server";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";


export async function getUserDetails(email: string) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`SELECT * FROM candidate WHERE email = ${email};`;
  console.log("User details:", response);
  return response;
}

export async function getRecruiterDetails(email: string) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`SELECT * FROM recruiter WHERE email = ${email};`;
  console.log("User details:", response);
  return response;
}

///////////////////////////////////////////////////////////
export async function getDetails() {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`select * from recruiter`;
  return response;

}

export async function getJobDetails(id: string) {
  try {
    console.log('Received ID:', id.toString());

    if (!id) {
      console.log('No ID provided, returning empty result');
      return [];
    }

    const recruiterId = parseInt(id);
    if (isNaN(recruiterId)) {
      console.log('Invalid ID format, returning empty result');
      return [];
    }

    const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
    const response = await sql`
      SELECT 
        recruiter.company_name,
        job.job_title,
        job.location,
        job.experience_required,
        job.job_id,
        job.min_cgpa
      FROM 
        recruiter
      JOIN 
        job ON recruiter.recruiter_id = job.recruiter_id
      WHERE 
        recruiter.recruiter_id = ${recruiterId}
    `;
    
    console.log('Database response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching job details:', error);
    return [];  // Return empty array on error
  }
}


export async function createJob(
  job_title: string,
  experience_required: string,
  location: string,
  deadline: Date,
  recruiterId: number,
  skills: string[],
  min_cgpa: number
) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    await sql`BEGIN`;

    const formattedDeadline = deadline.toISOString().split('T')[0];

    // First insert the job
    const jobResponse = await sql`
      INSERT INTO Job (
        job_title, 
        experience_required, 
        location, 
        deadline, 
        recruiter_id,
        status,
        created_at,
        min_cgpa
      )
      VALUES (
        ${job_title}, 
        ${experience_required}, 
        ${location}, 
        ${formattedDeadline}::date, 
        ${recruiterId}, 
        'open',
        CURRENT_TIMESTAMP,
        ${min_cgpa}::decimal(3,2)
      )
      RETURNING job_id;
    `;

    const jobId = jobResponse[0].job_id;

    // Insert skills using multiple separate queries
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        await sql`
          INSERT INTO requiredskill (job_id, skill_name)
          VALUES (${jobId}, ${skill});
        `;
      }
    }

    await sql`COMMIT`;
    return jobResponse;
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error creating job:', error);
    throw error;
  }
}

export async function getAppliedJobs(userId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`
    SELECT 
      j.job_title,
      j.location,
      j.experience_required,
      j.proficiencylevelreq AS proficiency_level_required,
      a.application_date,
      a.status AS application_status,
      c.f_name AS candidate_first_name,
      c.l_name AS candidate_last_name,
      c.email AS candidate_email,
      r.company_name AS recruiter_company_name,
      r.email AS recruiter_email
    FROM 
        Application AS a
    JOIN 
        Job AS j ON a.job_id = j.job_id
    JOIN 
        Candidate AS c ON a.candidate_id = c.candidate_id
    JOIN 
        Recruiter AS r ON j.recruiter_id = r.recruiter_id
    ORDER BY 
        a.application_date DESC;

  `;
  console.log("Applied jobs:", response);
  return response;
}

export async function createNewUser(
  firstName: string,
  lastName: string,
  email: string,
  userType: 'candidate' | 'recruiter',
  skills?: string[],
  companyName?: string,
  phoneNumber?: string,
  dateOfBirth?: string,
  location?: string,
  cgpa?: string
) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    await sql`BEGIN`;

    if (userType === 'candidate') {
      const cgpaNumber = cgpa ? parseFloat(cgpa) : null;
      if (cgpaNumber !== null && (isNaN(cgpaNumber) || cgpaNumber < 0 || cgpaNumber > 10)) {
        throw new Error('CGPA must be a number between 0 and 10');
      }

      const birthDate = new Date(dateOfBirth!);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const lastId = await sql`
        SELECT MAX(candidate_id) as last_id FROM Candidate
      `;
      const nextId = (lastId[0]?.last_id || 0) + 1;

      const candidateResponse = await sql`
        INSERT INTO Candidate (
          candidate_id,
          f_name,
          l_name,
          email,
          phone_number,
          date_of_birth,
          location,
          cgpa,
          age
        )
        VALUES (
          ${nextId},
          ${firstName},
          ${lastName},
          ${email},
          ${phoneNumber},
          ${dateOfBirth}::date,
          ${location},
          ${cgpaNumber}::decimal(3,2),
          ${age}
        )
        RETURNING candidate_id;
      `;

      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await sql`
            INSERT INTO skill (candidate_id, skill_name)
            VALUES (${nextId}, ${skill});
          `;
        }
      }

      return { userId: nextId, type: 'candidate' };

    } else {
      const lastId = await sql`
        SELECT MAX(recruiter_id) as last_id FROM Recruiter
      `;
      const nextId = (lastId[0]?.last_id || 0) + 1;

      const recruiterResponse = await sql`
        INSERT INTO Recruiter (recruiter_id, f_name, l_name, email, company_name)
        VALUES (${nextId}, ${firstName}, ${lastName}, ${email}, ${companyName})
        RETURNING recruiter_id;
      `;

      return { userId: nextId, type: 'recruiter' };
    }

  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Error in createNewUser:", error);
    throw error;
  }
}

export async function createJobApplication(
  jobId: number,
  candidateId: number | null,
  recruiterId: number
) {
  try {
    const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
    
    // Check if candidateId is null or undefined
    if (!candidateId) {
      return { error: "You must complete your candidate profile before applying" };
    }
    
    // Check if application already exists
    const existingApplication = await sql`
      SELECT application_id 
      FROM Application 
      WHERE job_id = ${jobId} AND candidate_id = ${candidateId}
    `;

    if (existingApplication.length > 0) {
      return { error: "You have already applied to this job" };
    }

    // If no existing application, create new one
    const response = await sql`
      INSERT INTO Application (
        job_id,
        candidate_id,
        application_date,
        status
      )
      VALUES (
        ${jobId},
        ${candidateId},
        CURRENT_TIMESTAMP,
        'pending'
      )
      RETURNING application_id;
    `;
    return { success: true, applicationId: response[0].application_id };
  } catch (error) {
    console.error('Error creating job application:', error);
    throw error;
  }
}

export async function getAppliedJobDetails(candidateId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`
    SELECT 
      a.application_id,
      a.application_date,
      a.status,
      a.job_id,
      a.candidate_id,
      j.job_title,
      j.location as job_location
    FROM 
      Application a
    JOIN 
      Job j ON a.job_id = j.job_id
    WHERE 
      a.candidate_id = ${candidateId}
    ORDER BY 
      a.application_date DESC
  `;
  console.log("Applied job details:", response);
  return response;
}


export async function getJobApplicationsByJobId(jobId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  try {
    const response = await sql`
      SELECT 
        a.application_id,
        a.application_date,
        a.status,
        a.job_id,
        a.candidate_id,
        c.f_name as candidate_first_name,
        c.l_name as candidate_last_name,
        c.email as candidate_email,
        j.job_title,
        j.location,
        j.experience_required,
        j.min_cgpa
      FROM 
        Application a
      JOIN 
        Candidate c ON a.candidate_id = c.candidate_id
      JOIN 
        Job j ON a.job_id = j.job_id
      WHERE 
        a.job_id = ${jobId}
      ORDER BY 
        a.application_date DESC
    `;
    console.log(response);
    return response;
  } catch (error) {
    console.error('Error fetching job applications:', error);
    throw error;
  }
}

export async function getJobDetailsById(recruiterId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`
    SELECT 
      *,
      min_cgpa
    FROM 
      JOB 
    WHERE 
      RECRUITER_ID = ${recruiterId}
  `;
  console.log(response);
  return response;
}

// Add new function to get candidate with skills
export async function getCandidateWithSkills(candidateId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`
    SELECT 
      c.candidate_id,
      c.f_name,
      c.l_name,
      c.email,
      c.phone_number,
      c.date_of_birth,
      c.location,
      c.cgpa,
      COALESCE(ARRAY_AGG(s.skill_name), '{}') AS skills
    FROM 
      Candidate c
    LEFT JOIN 
      Skill s ON c.candidate_id = s.candidate_id
    WHERE 
      c.candidate_id = ${candidateId}
    GROUP BY 
      c.candidate_id, c.f_name, c.l_name, c.email, c.phone_number, 
      c.date_of_birth, c.location, c.cgpa;
  `;
  return response;
}

// Update the function to work with candidate skills
export async function updateCandidateDetails({
  candidateId,
  firstName,
  lastName,
  phone_number,
  date_of_birth,
  location,
  cgpa,
  skills,
}: {
  candidateId: number;
  firstName: string;
  lastName: string;
  phone_number: string;
  date_of_birth: string;
  location: string;
  cgpa: string;
  skills: string[];
}) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    await sql`BEGIN`;

    // Validate CGPA
    const cgpaNumber = parseFloat(cgpa);
    if (isNaN(cgpaNumber) || cgpaNumber < 0 || cgpaNumber > 10) {
      throw new Error('CGPA must be a number between 0 and 10');
    }

    // Update candidate details
    await sql`
      UPDATE Candidate
      SET 
        f_name = ${firstName},
        l_name = ${lastName},
        phone_number = ${phone_number},
        date_of_birth = ${date_of_birth}::date,
        location = ${location},
        cgpa = ${cgpaNumber}::decimal(3,2)
      WHERE candidate_id = ${candidateId};
    `;

    // Existing skills update logic...
    const existingSkills = await sql`
      SELECT skill_name 
      FROM Skill 
      WHERE candidate_id = ${candidateId};
    `;
    const existingSkillNames = existingSkills.map(s => s.skill_name);

    // Find new skills to add
    const skillsToAdd = skills.filter(skill => !existingSkillNames.includes(skill));

    // Find skills to remove
    const skillsToRemove = existingSkillNames.filter(skill => !skills.includes(skill));

    // Remove skills that are no longer needed
    if (skillsToRemove.length > 0) {
      await sql`
        DELETE FROM Skill
        WHERE candidate_id = ${candidateId}
        AND skill_name = ANY(${skillsToRemove}::text[]);
      `;
    }

    // Add new skills
    for (const skill of skillsToAdd) {
      await sql`
        INSERT INTO Skill (candidate_id, skill_name)
        VALUES (${candidateId}, ${skill});
      `;
    }

    await sql`COMMIT`;
    return { success: true };

  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Error updating candidate details:", error);
    throw error;
  }
}

// Add this function to handle resume uploads
export async function uploadResume(
  candidateId: number,
  fileBuffer: Buffer,
  fileName: string,
  fileType: string
) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    await sql`BEGIN`;

    
    const base64Data = fileBuffer.toString('base64');

    const response = await sql`
      INSERT INTO Resume (
        candidate_id,
        file_name,
        file_type,
        file_data,
        uploaded_at
      )
      VALUES (
        ${candidateId},
        ${fileName},
        ${fileType},
        decode(${base64Data}, 'base64'),
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (candidate_id) 
      DO UPDATE SET
        file_name = EXCLUDED.file_name,
        file_type = EXCLUDED.file_type,
        file_data = decode(${base64Data}, 'base64'),
        uploaded_at = CURRENT_TIMESTAMP
      RETURNING resume_id;
    `;

    await sql`COMMIT`;
    return { success: true, resumeId: response[0].resume_id };

  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Error uploading resume:", error);
    throw error;
  }
}

// Add this function to get resume details
export async function getResumeByCandidate(candidateId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  try {
    const response = await sql`
      SELECT 
        resume_id,
        file_name,
        file_type,
        encode(file_data, 'base64') as file_data,
        uploaded_at
      FROM 
        Resume
      WHERE 
        candidate_id = ${candidateId}
    `;
    return response[0];
  } catch (error) {
    console.error("Error fetching resume:", error);
    throw error;
  }
}

// Function to calculate and store recommendations for a job
export async function generateRecommendations(jobId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    // First, get job details including required skills
    const jobDetails = await sql`
      SELECT 
        j.*,
        array_remove(ARRAY_AGG(DISTINCT rs.skill_name), NULL) as required_skills
      FROM 
        Job j
      LEFT JOIN 
        RequiredSkill rs ON j.job_id = rs.job_id
      WHERE 
        j.job_id = ${jobId}
      GROUP BY 
        j.job_id
    `;

    if (!jobDetails[0]) {
      throw new Error('Job not found');
    }

    const job = jobDetails[0];

    // Get candidates with their experience_years
    const candidates = await sql`
      SELECT 
        c.*,
        array_remove(ARRAY_AGG(DISTINCT s.skill_name), NULL) as skills
      FROM 
        Candidate c
      JOIN 
        Application a ON c.candidate_id = a.candidate_id
      LEFT JOIN 
        Skill s ON c.candidate_id = s.candidate_id
      WHERE 
        a.job_id = ${jobId}
      GROUP BY 
        c.candidate_id
    `;

    // Delete existing recommendations
    await sql`DELETE FROM Recommendation WHERE job_id = ${jobId}`;

    // Calculate and store recommendations for each candidate
    for (const candidate of candidates) {
      const skillMatchScore = calculateSkillMatch(candidate.skills || [], job.required_skills || []);
      const locationMatchScore = calculateLocationMatch(candidate.location, job.location);
      
      // Use experience_years from candidate and experience_required from job
      const experienceMatchScore = calculateExperienceMatch(
        candidate.experience_years || 0,
        parseInt(job.experience_required) || 0
      );
      
      const cgpaMatchScore = candidate.cgpa >= job.min_cgpa ? 100 : (candidate.cgpa / job.min_cgpa) * 100;

      const overallMatchScore = (
        (skillMatchScore * 0.4) +
        (locationMatchScore * 0.2) +
        (experienceMatchScore * 0.2) +
        (cgpaMatchScore * 0.2)
      );

      await sql`
        INSERT INTO Recommendation (
          job_id,
          candidate_id,
          match_score,
          skill_match_score,
          location_match_score,
          experience_match_score,
          cgpa_match_score
        ) VALUES (
          ${jobId},
          ${candidate.candidate_id},
          ${overallMatchScore},
          ${skillMatchScore},
          ${locationMatchScore},
          ${experienceMatchScore},
          ${cgpaMatchScore}
        )
      `;
    }

    return { success: true };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

// Function to get recommendations for a job
export async function getRecommendations(jobId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    await generateRecommendations(jobId);

    const recommendations = await sql`
      SELECT 
        r.*,
        c.f_name,
        c.l_name,
        c.email,
        c.location,
        c.cgpa,
        c.experience_years,
        array_remove(ARRAY_AGG(DISTINCT s.skill_name), NULL) as skills
      FROM 
        Recommendation r
      JOIN 
        Candidate c ON r.candidate_id = c.candidate_id
      JOIN 
        Application a ON c.candidate_id = a.candidate_id AND a.job_id = r.job_id
      LEFT JOIN 
        Skill s ON c.candidate_id = s.candidate_id
      WHERE 
        r.job_id = ${jobId}
      GROUP BY 
        r.recommendation_id,
        r.job_id,
        r.candidate_id,
        r.match_score,
        r.skill_match_score,
        r.location_match_score,
        r.experience_match_score,
        r.cgpa_match_score,
        r.created_at,
        c.f_name,
        c.l_name,
        c.email,
        c.location,
        c.cgpa,
        c.experience_years
      ORDER BY 
        r.match_score DESC
    `;

    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

// Helper functions for score calculations
function calculateSkillMatch(candidateSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 100;
  const matchedSkills = candidateSkills.filter(skill => 
    requiredSkills.some(req => req.toLowerCase() === skill.toLowerCase())
  );
  return (matchedSkills.length / requiredSkills.length) * 100;
}

function calculateLocationMatch(candidateLocation: string | null, jobLocation: string): number {
  if (!candidateLocation) return 0;
  return candidateLocation.toLowerCase() === jobLocation.toLowerCase() ? 100 : 0;
}

function calculateExperienceMatch(candidateExp: number, requiredExp: number): number {
  if (requiredExp === 0) return 100;
  return candidateExp >= requiredExp ? 100 : (candidateExp / requiredExp) * 100;
}

function calculateCGPAMatch(candidateCGPA: number, minCGPA: number): number {
  if (minCGPA === 0) return 100;
  return candidateCGPA >= minCGPA ? 100 : (candidateCGPA / minCGPA) * 100;
}