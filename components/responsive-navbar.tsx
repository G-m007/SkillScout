"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/server";
import { useRouter } from "next/navigation";
import React from "react";
export default function ResponsiveNavbar({ user }: { user: User }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const router = useRouter();
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  console.log(user);
  return (
    <nav className="bg-background shadow-md dark:shadow-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors duration-300 truncate">
                SkillScout
              </span>
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-4 lg:ml-10 flex items-baseline space-x-2 lg:space-x-4">
              <NavLink href="/about">Home</NavLink>
              <NavLink href="/about">Blogs</NavLink>
              <NavLink href="/about">About</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </div>
          </div>

          {/* Login Button and Dark Mode Toggle */}

          <motion.div
            className="hidden md:flex items-center space-x-2 lg:space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {user ? (
              <>
                <Button variant="ghost" onClick={() => router.push("/profile")}>
                  Profile
                </Button>
                <SignOutButton>
                  <Button variant="destructive">Sign Out</Button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton>
                <Button variant="secondary" className="bg-white hover:bg-white/90 text-black">
                  Sign In
                </Button>
              </SignInButton>
            )}
            {mounted && (
              <Toggle
                aria-label="Toggle dark mode"
                pressed={theme === "dark"}
                onPressedChange={toggleTheme}
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Toggle>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {mounted && (
              <Toggle
                aria-label="Toggle dark mode"
                pressed={theme === "dark"}
                onPressedChange={toggleTheme}
                className="mr-2"
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Toggle>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-primary hover:text-primary/80 transition-colors duration-300"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed w-full bg-background border-t border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink href="/about" mobile>
                About
              </NavLink>
              <NavLink href="" mobile>
                Home
              </NavLink>
              <NavLink href="/contact" mobile>
                Contact
              </NavLink>
              <NavLink href="" mobile>
                Blogs
              </NavLink>
              {user && (
                <NavLink href="/profile" mobile>
                  Profile
                </NavLink>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="px-5 space-y-2">
            
                  <SignOutButton>
                    <Button className="w-full" variant="destructive">
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              ) : (
                <div className="px-5">
                  <SignInButton>
                    <Button variant="secondary" className="w-full bg-white hover:bg-white/90 text-black">
                      Sign In
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({
  href,
  children,
  mobile = false,
}: {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  const baseClasses =
    "text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out";
  const desktopClasses = "text-sm font-medium px-3 py-2 rounded-md";
  const mobileClasses = "block px-3 py-2 text-base font-medium rounded-md";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${mobile ? mobileClasses : desktopClasses}`}
    >
      {children}
    </Link>
  );
}
