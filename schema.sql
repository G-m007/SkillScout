-- Create enum types
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE job_status AS ENUM ('open', 'closed');

-- Create Candidate table
CREATE TABLE Candidate (
    candidate_id INTEGER PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    location VARCHAR(100),
    cgpa DECIMAL(3,2) CHECK (cgpa >= 0 AND cgpa <= 10),
    age INTEGER,
    experience_years INTEGER DEFAULT 0
);

-- Create Recruiter table
CREATE TABLE Recruiter (
    recruiter_id INTEGER PRIMARY KEY,
    f_name VARCHAR(50) NOT NULL,
    l_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL
);

-- Create Job table
CREATE TABLE Job (
    job_id SERIAL PRIMARY KEY,
    job_title VARCHAR(100) NOT NULL,
    experience_required VARCHAR(50),
    location VARCHAR(100),
    deadline DATE,
    recruiter_id INTEGER REFERENCES Recruiter(recruiter_id),
    status job_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    min_cgpa DECIMAL(3,2) DEFAULT 0.00,
    proficiencylevelreq VARCHAR(50)
);

-- Create Application table
CREATE TABLE Application (
    application_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES Job(job_id),
    candidate_id INTEGER REFERENCES Candidate(candidate_id),
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status application_status DEFAULT 'pending',
    UNIQUE(job_id, candidate_id)
);

-- Create Skill table (for candidates)
CREATE TABLE Skill (
    skill_id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES Candidate(candidate_id),
    skill_name VARCHAR(50) NOT NULL,
    UNIQUE(candidate_id, skill_name)
);

-- Create RequiredSkill table (for jobs)
CREATE TABLE RequiredSkill (
    required_skill_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES Job(job_id),
    skill_name VARCHAR(50) NOT NULL,
    UNIQUE(job_id, skill_name)
);

-- Create Resume table
CREATE TABLE Resume (
    resume_id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES Candidate(candidate_id) UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_data BYTEA NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Recommendation table
CREATE TABLE Recommendation (
    recommendation_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES Job(job_id),
    candidate_id INTEGER REFERENCES Candidate(candidate_id),
    match_score DECIMAL(5,2) NOT NULL,
    skill_match_score DECIMAL(5,2) NOT NULL,
    location_match_score DECIMAL(5,2) NOT NULL,
    experience_match_score DECIMAL(5,2) NOT NULL,
    cgpa_match_score DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, candidate_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_candidate_email ON Candidate(email);
CREATE INDEX idx_recruiter_email ON Recruiter(email);
CREATE INDEX idx_job_recruiter ON Job(recruiter_id);
CREATE INDEX idx_application_job ON Application(job_id);
CREATE INDEX idx_application_candidate ON Application(candidate_id);
CREATE INDEX idx_skill_candidate ON Skill(candidate_id);
CREATE INDEX idx_requiredskill_job ON RequiredSkill(job_id);
CREATE INDEX idx_recommendation_job ON Recommendation(job_id);
CREATE INDEX idx_recommendation_score ON Recommendation(match_score DESC);

-- Create stored procedure for job application
CREATE OR REPLACE PROCEDURE create_job_application(
    p_job_id INT,
    p_candidate_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_application INT;
BEGIN
    -- Check if candidateId is null
    IF p_candidate_id IS NULL THEN
        RAISE EXCEPTION 'You must complete your candidate profile before applying';
    END IF;

    -- Check for existing application
    SELECT application_id INTO v_existing_application
    FROM Application 
    WHERE job_id = p_job_id AND candidate_id = p_candidate_id;

    IF v_existing_application IS NOT NULL THEN
        RAISE EXCEPTION 'You have already applied to this job';
    END IF;

    -- Create new application
    INSERT INTO Application (
        job_id,
        candidate_id,
        application_date,
        status
    )
    VALUES (
        p_job_id,
        p_candidate_id,
        CURRENT_TIMESTAMP,
        'pending'
    );
END;
$$;

-- Create trigger to update job status based on deadline
CREATE OR REPLACE FUNCTION update_job_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deadline < CURRENT_DATE THEN
        NEW.status = 'closed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_deadline_trigger
    BEFORE INSERT OR UPDATE ON Job
    FOR EACH ROW
    EXECUTE FUNCTION update_job_status();

-- Create trigger to calculate age on candidate insert/update
CREATE OR REPLACE FUNCTION calculate_age()
RETURNS TRIGGER AS $$
BEGIN
    NEW.age = DATE_PART('year', AGE(CURRENT_DATE, NEW.date_of_birth));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidate_age_trigger
    BEFORE INSERT OR UPDATE ON Candidate
    FOR EACH ROW
    EXECUTE FUNCTION calculate_age(); 