'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, LANGUAGES, Language } from '@/contexts/language-context';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          title="Change Language"
        >
          <Globe className="h-5 w-5 text-foreground/80" />
          <span className="sr-only">Change language</span>
          {/* Language indicator */}
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs px-1 py-0.5 min-w-[16px] h-4 flex items-center justify-center font-mono text-[10px]">
            {currentLanguage.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="glass-card w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-foreground/80 border-b border-border/50">
          Select Language
        </div>
        
        {Object.entries(LANGUAGES).map(([code, language]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={cn(
              "cursor-pointer flex items-center justify-between py-2 px-3",
              currentLanguage === code && "bg-primary/10"
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.name}</span>
              <span className="text-sm text-foreground/60">{language.nativeName}</span>
            </div>
            
            {currentLanguage === code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <div className="px-2 py-1.5 text-xs text-foreground/50 border-t border-border/50">
          Powered by Google Translate
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
