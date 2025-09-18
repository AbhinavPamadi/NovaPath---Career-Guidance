"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/quiz', label: 'Quiz' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/career-path', label: 'Career Path' },
  { href: '/peer-to-peer-forum', label: 'Forum' },
  { href: '/ngo-connection', label: 'NGO Connection' },
  { href: '/feedback-forum', label: 'Feedback' },
];

export function NavLinks() {
  const pathname = usePathname();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const href = e.currentTarget.href;
    if (href.includes("/#")) {
      e.preventDefault();
      const targetId = href.split('#')[1];
      const elem = document.getElementById(targetId);
      elem?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={item.href.includes('/#') ? handleScroll : undefined}
          className={cn(
            'transition-colors hover:text-foreground/80 relative',
            pathname === item.href ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          {item.label}
          {pathname === item.href && (
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent rounded-full animate-in fade-in"></span>
          )}
        </Link>
      ))}
    </nav>
  );
}
