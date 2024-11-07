import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <p>
          <a href="/" className="text-blue-500 hover:underline">
            Return to Home
          </a>
        </p>
      </div>
    </div>
  );
} 