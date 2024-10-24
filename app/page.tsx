"use client";
import AppPage from "@/components/app-page";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { useUser } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";

export default function Home() {
  const { user } = useUser();
  return (
    <div className="flex flex-col gap-y-5">
      <ResponsiveNavbar user={user as unknown as User} />
      <AppPage user={user as unknown as User} />
    </div>
  );
}
