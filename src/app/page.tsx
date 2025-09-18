import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Bot, CalendarCheck, FileQuestion, HeartHandshake, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, ThumbsUp, AlertCircle, User } from 'lucide-react';
import { QuizWidget } from '@/components/quiz/quiz-widget';
import { Translate } from '@/hooks/use-translation';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-24 overflow-hidden">
      <div className="relative">
        <div className="absolute top-[-5rem] -left-24 w-72 h-72 bg-primary rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-[-1rem] -right-24 w-80 h-80 bg-accent rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      <section className="text-center relative z-10">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 mb-6">
          <Translate text="Navigate Your Future with" />
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary mt-2">
            NovaPath
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
          <Translate text="An ultra-modern guidance platform using AI to illuminate your career and educational journey. Step into the future of decision-making." />
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="animate-pulse-glow shadow-primary/50 shadow-lg hover:shadow-primary/50 hover:shadow-2xl transition-shadow">
            <Link href="/quiz">
              <Translate text="Find Your Path" /> <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/timeline">
              <Translate text="Explore Timeline" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="quiz" className="mt-24 md:mt-32 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            <Translate text="Discover Your Path" />
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            <Translate text="Take our interactive quiz to uncover your ideal career direction." />
          </p>
        </div>
        <QuizWidget />
      </section>

      <section id="features" className="mt-24 md:mt-32 scroll-mt-20">
        <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                <Translate text="Explore Our Features" />
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              <Translate text="A suite of tools designed to guide you to success." />
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
                href="/quiz"
                icon={<FileQuestion className="h-8 w-8 text-primary" />}
                title="Gamified Quiz System"
                description="Engaging quizzes make self-discovery fun. Watch your future unfold with every answer."
            />
            <FeatureCard
                href="/timeline"
                icon={<CalendarCheck className="h-8 w-8 text-primary" />}
                title="Interactive Timeline"
                description="Never miss a deadline. Track exams, admissions, and scholarships on a personalized, interactive timeline."
            />
            <FeatureCard
                href="/peer-to-peer-forum"
                icon={<Users className="h-8 w-8 text-primary" />}
                title="Peer-to-Peer Forum"
                description="Get real advice from students just a few steps ahead of you. Find mentors and ask questions."
            />
            <FeatureCard
                href="/ngo-connection"
                icon={<HeartHandshake className="h-8 w-8 text-primary" />}
                title="NGO Connection"
                description="Discover and connect with NGOs that align with your passions and career goals."
            />
            <FeatureCard
                href="#"
                icon={<Bot className="h-8 w-8 text-primary" />}
                title="Nova - Smart AI Assistant"
                description="Nova is your dedicated AI assistant, ready to provide career guidance and recommendations."
            />
        </div>
      </section>

      <section id="feedback" className="mt-24 md:mt-32 scroll-mt-20">
        <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Feedback Forum
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
                Share your thoughts, suggestions, and help us improve NovaPath together.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <Card className="glass-card p-6 text-center hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="mb-4 flex justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-headline text-xl font-bold mb-2">Share Feedback</h3>
            <p className="text-muted-foreground text-sm">Tell us what you think about NovaPath and how we can improve your experience.</p>
          </Card>
          
          <Card className="glass-card p-6 text-center hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="mb-4 flex justify-center">
              <ThumbsUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-headline text-xl font-bold mb-2">Vote on Ideas</h3>
            <p className="text-muted-foreground text-sm">Vote for the features and improvements that matter most to you.</p>
          </Card>
          
          <Card className="glass-card p-6 text-center hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-headline text-xl font-bold mb-2">Report Issues</h3>
            <p className="text-muted-foreground text-sm">Found a bug or something not working? Let us know so we can fix it quickly.</p>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="shadow-primary/50 shadow-lg hover:shadow-primary/50 hover:shadow-2xl transition-shadow">
            <Link href="/feedback-forum">
              Join the Discussion <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  const isExternal = href.startsWith('http');
  const CardContent = (
    <Card className="glass-card p-8 text-center items-center flex flex-col h-full hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-2">
      <div className="mb-4">{icon}</div>
      <h3 className="font-headline text-2xl font-bold mb-2">
        <Translate text={title} />
      </h3>
      <p className="text-muted-foreground flex-grow">
        <Translate text={description} />
      </p>
    </Card>
  );

  if (href === '#') {
    return <div className="cursor-default h-full">{CardContent}</div>
  }
  
  return (
    <Link 
      href={href} 
      target={isExternal ? '_blank' : undefined} 
      rel={isExternal ? 'noopener noreferrer' : undefined} 
      className="block h-full"
    >
      {CardContent}
    </Link>
  );
}