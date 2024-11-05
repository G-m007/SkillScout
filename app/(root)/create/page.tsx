"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SelectItem } from "@/components/ui/select";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Job, User } from "@/types";
import { createJob, getJobs, getRecruiterDetails, getUserDetails } from "@/server";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  job_title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  experience_required: z.coerce.number().min(0, {
    message: "Experience required must be a positive number.",
  }),
  location: z.string().min(3, {
    message: "Location must be at least 3 characters.",
  }),
  deadline: z.date({
    required_error: "A deadline is required.",
  }),
  skills: z.array(z.string()).min(1, {
    message: "At least one skill is required.",
  }),
});

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

export default function PostJobPage() {
  const router = useRouter();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const { user } = useUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: "",
      experience_required: 0,
      location: "",
      skills: [],
    },
  });
  const { toast } = useToast();
  const { data, isLoading } = useQuery<>({
    queryKey: ["user"],
    queryFn: async () => {
      const result = await getRecruiterDetails(
        user?.emailAddresses[0].emailAddress as string
      );
      console.log(result);
      return result;
    },
    enabled: !!user?.emailAddresses[0].emailAddress,
  });
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const result = await createJob(
        values.job_title,
        values.experience_required.toString(),
        values.location,
        values.deadline,
        data?.[0].recruiter_id as number,
        values.skills
      );
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Job posted successfully",
        description: "Your job has been posted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "An error occurred while posting your job",
      });
    },
  });
  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
    router.push("/jobs");
  }

  const handleSkillSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
    form.setValue("skills", selectedSkills);
  };
  return (
    <div className="container mx-auto py-8 px-4 min-h-screen bg-gradient-to-b from-background to-muted">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Create Job Opening</CardTitle>
          <CardDescription className="text-lg">
            Fill in the details for the new job opening
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Job Title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Required (years)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter years of experience required"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the minimum years of experience required for this position
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Job Location"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                    
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                     
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">Required Skills</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/50">
                        {availableSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant={selectedSkills.includes(skill) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all hover:scale-105",
                              selectedSkills.includes(skill) 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-primary/10"
                            )}
                            onClick={() => handleSkillSelect(skill)}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="w-full sm:w-auto transition-all hover:scale-105"
              >
                {mutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⭕</span>
                    Posting...
                  </>
                ) : (
                  "Post Job"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
