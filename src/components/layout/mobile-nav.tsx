"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems } from "./nav-links";
import { cn } from "@/lib/utils";
import { Logo } from "../icons/logo";
import { ThemeToggleButton } from "./theme-toggle-button";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open Menu</span>
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-20 md:hidden">
          <div className="fixed left-0 top-0 z-50 h-full w-full max-w-xs bg-background shadow-lg animate-in slide-in-from-left-80">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center space-x-2 font-headline font-bold text-2xl"
                  onClick={() => setIsOpen(false)}
                >
                  <Logo />
                  <span className="holographic-text">NovaPath</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close Menu</span>
                </Button>
              </div>
              <nav className="mt-8 flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              
              {/* Theme Toggle for Mobile */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/80">Settings</span>
                  <div className="flex items-center space-x-2">
                    <ThemeToggleButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
