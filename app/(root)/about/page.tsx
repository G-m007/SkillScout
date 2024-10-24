import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          About SkillScout
        </h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              At SkillScout, our mission is to seamlessly connect talented
              candidates with recruiters looking for specialized skills. We aim
              to simplify the hiring process through a modern, user-friendly
              platform that facilitates effective talent acquisition. By
              offering advanced matching algorithms and a personalized
              experience, we empower both job seekers and employers to achieve
              their goals in today's competitive job market.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Story</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              SkillScout was created out of the need to streamline the recruitment process
              for companies and to offer candidates a platform to showcase their skills
              and achievements. What started as a small project has grown into a fully
              functional job portal that connects professionals across industries.
            </p>
            <p className="text-muted-foreground">
              Over time, we’ve implemented various innovations to enhance the user experience,
              from intuitive design features to AI-driven recommendations. Our goal has
              always been to make job searching and hiring as efficient and transparent as possible.
            </p>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}
