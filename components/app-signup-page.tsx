"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createNewUser } from "@/server";
import { useToast } from "@/hooks/use-toast";
const skillOptions = [
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "React", value: "react" },
  { label: "Node.js", value: "nodejs" },
  { label: "SQL", value: "sql" },
  { label: "Machine Learning", value: "machine-learning" },
  { label: "Data Analysis", value: "data-analysis" },
  { label: "UI/UX Design", value: "ui-ux-design" },
  { label: "Project Management", value: "project-management" },
];

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["candidate", "recruiter"], {
    required_error: "Please select a user type",
  }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  dateOfBirth: z.string().optional(),
  location: z.string().min(2, "Location must be at least 2 characters").optional(),
  skills: z.array(z.string()).default([]),
  companyName: z.string().default(""),
}).refine((data) => {
  if (data.userType === "candidate") {
    return data.skills.length > 0 && 
           data.phoneNumber && 
           data.dateOfBirth && 
           data.location;
  }
  return true;
}, {
  message: "Please fill in all required fields",
  path: ["skills"]
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      email: "",
      userType: undefined,
      phoneNumber: "",
      dateOfBirth: "",
      location: "",
      skills: [],
      companyName: "",
    },
  });

  const onSubmit = async () => {
    if (!isLoaded) return;
    try {
      await signUp.create({
        emailAddress: form.getValues("email") as string,
        password: form.getValues("password") as string,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to sign up",
        variant: "destructive",
      });
      console.error(JSON.stringify(err, null, 2));
    }
  };
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        toast({
          title: "Success",
          description: "Email verified successfully",
        });
        router.push("/");
      } else {
        toast({
          title: "Error",
          description: "Failed to verify email",
          variant: "destructive",
        });
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      console.error("Error:", JSON.stringify(err, null, 2));
    }
  };
  const mutation = useMutation({
    mutationFn: async () => {
      const formData = form.getValues();
      const result = await createNewUser(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.userType,
        formData.userType === "candidate" ? formData.skills : [],
        formData.userType === "recruiter" ? formData.companyName : undefined,
        formData.phoneNumber,
        formData.dateOfBirth,
        formData.location
      );
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
      console.error("Error creating user:", error);
    },
  });
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center flex-col gap-4 justify-center bg-background p-4">
        <h1>Verify your email</h1>
        <form
          onSubmit={handleVerify}
          className="flex flex-col gap-4 border border-b-gray-400 p-4 rounded-md"
        >
          <label id="code">Enter your verification code</label>
          <Input
            value={code}
            id="code"
            name="code"
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" className="w-full mt-4">
            Verify
          </Button>
        </form>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="candidate">Candidate</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("userType") === "candidate" && (
                <>
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number*</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="Enter your phone number" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth*</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location*</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your location" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            if (!field.value.includes(value)) {
                              field.onChange([...field.value, value]);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select at least one skill" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skillOptions.map((skill) => (
                              <SelectItem key={skill.value} value={skill.label}>
                                {skill.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          {field.value.map((skill) => (
                            <div
                              key={skill}
                              className="inline-flex items-center gap-2 bg-secondary rounded-md px-2 py-1 mr-2 mb-2"
                            >
                              <span>{skill}</span>
                              <X
                                className="h-4 w-4 cursor-pointer"
                                onClick={() => {
                                  field.onChange(
                                    field.value.filter((s) => s !== skill)
                                  );
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.watch("userType") === "recruiter" && (
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                onClick={() => mutation.mutate()}
              >
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
