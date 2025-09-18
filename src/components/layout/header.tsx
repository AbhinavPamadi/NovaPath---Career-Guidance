
import Link from 'next/link';
import { NavLinks } from './nav-links';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThemeToggleButton } from './theme-toggle-button';
import { MobileNav } from './mobile-nav';
import { Logo } from '../icons/logo';
import { UserMenu } from './user-menu';
import { NotificationPanel } from './notifications';
import { LanguageSelector } from './language-selector';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/50 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link
          href="/"
          className="mr-6 flex items-center space-x-2 font-headline font-bold text-2xl"
        >
          <Logo />
          <span className="holographic-text">NovaPath</span>
        </Link>
        <div className="hidden md:flex flex-1">
          <NavLinks />
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5 text-foreground/80" />
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 glass-card w-auto max-w-[calc(100vw-1rem)]">
              <NotificationPanel />
            </PopoverContent>
          </Popover>

          <UserMenu />

          <LanguageSelector />

          <ThemeToggleButton />
          
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
