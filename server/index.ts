"use server";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

export async function getJobs() {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response =
    await sql`SELECT j.job_id, j.title, j.description, j.status, j.budget, j.deadline, u.name AS client_name, array_agg(sr.skill_name) AS skills_required
		FROM Jobs j
		JOIN Users u ON j.client_id = u.user_id
		LEFT JOIN SkillsRequired sr ON j.job_id = sr.job_id
		GROUP BY j.job_id, u.name
		ORDER BY j.job_id;`;
  return response;
}

export async function getJobById(jobId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`SELECT 
    Bids.bid_id,
    Users.name AS freelancer_name,
    Bids.bid_amount,
    Bids.status,
    Bids.created_at
FROM 
    Bids
JOIN 
    Users ON Bids.freelancer_id = Users.user_id
WHERE 
    Bids.job_id = ${jobId};
`;
  return response;
}

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

export async function getUserWithSkills(userId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`SELECT 
    Users.user_id,
    Users.name,
    Users.email,
    Users.role,
    Users.rating,
    Users.created_at,
    COALESCE(ARRAY_AGG(Skills.skill_name), '{}') AS skills
FROM 
    Users
LEFT JOIN 
    Skills ON Users.user_id = Skills.user_id
WHERE 
    Users.user_id = ${userId}
GROUP BY 
    Users.user_id;`;
  console.log("User with skills:", response);
  return response;
}


export async function getUserPostedJobs(userId: number) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`
    SELECT 
    j.job_id,
    j.title,
    j.description,
    j.budget,
    j.deadline,
    j.status AS job_status,
    json_agg(
        json_build_object(
            'bid_id', b.bid_id,
            'freelancer_id', b.freelancer_id,
            'freelancer_name', u.name,
            'bid_amount', b.bid_amount,
            'status', b.status
        )
    ) AS bids
FROM Jobs j
LEFT JOIN Bids b ON j.job_id = b.job_id
LEFT JOIN Users u ON b.freelancer_id = u.user_id
WHERE j.client_id = ${userId}
GROUP BY j.job_id;
  `;
  console.log("User posted jobs:", response);
  return response;
}

export async function updateUserDetails({
  userId,
  name,
  skills,
}: {
  userId: number;
  name: string;
  skills: string[];
}) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  const response = await sql`
      UPDATE Users
      SET name = ${name}
      WHERE user_id = ${userId};
    `;
  console.log("User updated:", response);
  const deleteSkills = await sql`
      DELETE FROM Skills
      WHERE user_id = ${userId};
    `;
  for (const skill of skills) {
    await sql`
        INSERT INTO Skills (user_id, skill_name)
        VALUES (${userId}, ${skill});
      `;
  }

  return deleteSkills;
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
        job.job_id
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
  skills: string[]
) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  try {
    await sql`BEGIN`;

    // Convert the deadline Date to a PostgreSQL date format
    const formattedDeadline = deadline.toISOString().split('T')[0];

    const jobResponse = await sql`
      INSERT INTO Job (
        job_title, 
        experience_required, 
        location, 
        deadline, 
        recruiter_id,
        status,
        created_at
      )
      VALUES (
        ${job_title}, 
        ${experience_required}, 
        ${location}, 
        ${formattedDeadline}::date, 
        ${recruiterId}, 
        'open',
        CURRENT_TIMESTAMP
      )
      RETURNING job_id;
    `;

    const jobId = jobResponse[0].job_id;

    for (const skill of skills) {
      await sql`
        INSERT INTO requiredskill (job_id, skill_name)
        VALUES (${jobId}, ${skill})
      `;
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
  companyName?: string
) {
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
  
  // Check if user exists in either table
  const existingCandidate = await sql`
    SELECT email FROM Candidate WHERE email = ${email}
  `;
  const existingRecruiter = await sql`
    SELECT email FROM Recruiter WHERE email = ${email}
  `;

  if (existingCandidate.length > 0 || existingRecruiter.length > 0) {
    return { error: "User already exists. Please sign in instead." };
  }

  console.log("Creating new user:", { firstName, lastName, email, userType, skills, companyName });

  try {
    if (userType === 'candidate') {
      // Get the next candidate_id
      const lastId = await sql`
        SELECT MAX(candidate_id) as last_id FROM Candidate
      `;
      const nextId = (lastId[0]?.last_id || 0) + 1;

      // Insert into Candidate table
      const candidateResponse = await sql`
        INSERT INTO Candidate (candidate_id, f_name, l_name, email)
        VALUES (${nextId}, ${firstName}, ${lastName}, ${email})
        RETURNING candidate_id;
      `;

      // If skills are provided, insert them
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await sql`
            INSERT INTO skill (candidate_id, skill_name)
            VALUES (${nextId}, ${skill});
          `;
        }
      }

      console.log("Candidate created successfully:", candidateResponse);
      return { userId: nextId, type: 'candidate' };

    } else {
      // Get the next recruiter_id
      const lastId = await sql`
        SELECT MAX(recruiter_id) as last_id FROM Recruiter
      `;
      const nextId = (lastId[0]?.last_id || 0) + 1;

      // Insert into Recruiter table with company name
      const recruiterResponse = await sql`
        INSERT INTO Recruiter (recruiter_id, f_name, l_name, email, company_name)
        VALUES (${nextId}, ${firstName}, ${lastName}, ${email}, ${companyName})
        RETURNING recruiter_id;
      `;

      console.log("Recruiter created successfully:", recruiterResponse);
      return { userId: nextId, type: 'recruiter' };
    }

  } catch (error) {
    console.error("Error in createNewUser:", error);
    throw error;
  }
}

export async function createJobApplication(
  jobId: number,
  candidateId: number,
  recruiterId: number
) {
  try {
    const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);
    
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
    return response;
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
        j.experience_required
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
  const response = await sql`SELECT * FROM JOB WHERE RECRUITER_ID = ${recruiterId}`;
  console.log(response)
  return response;
}