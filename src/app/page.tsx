import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Bot, CalendarCheck, Target, FileQuestion, HeartHandshake, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, User } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-24 overflow-hidden">
      <div className="relative">
        <div className="absolute top-[-5rem] -left-24 w-72 h-72 bg-primary rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-[-1rem] -right-24 w-80 h-80 bg-accent rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      <section className="text-center relative z-10">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 mb-6">
          Navigate Your Future with
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary mt-2">
            NovaPath
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
          An ultra-modern guidance platform using AI to illuminate your career and educational journey. Step into the future of decision-making.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="animate-pulse-glow shadow-primary/50 shadow-lg hover:shadow-primary/50 hover:shadow-2xl transition-shadow">
            <Link href="/quiz">
              Find Your Path <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/timeline">Explore Timeline</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="mt-24 md:mt-32 scroll-mt-20">
        <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Explore Our Features
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              A suite of tools designed to guide you to success.
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
                href="/career-path"
                icon={<Target className="h-8 w-8 text-primary" />}
                title="AI Career Matcher"
                description="Our AI suggests perfect career paths by analyzing your interests, skills, and personality."
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

      <section id="contact" className="mt-24 md:mt-32 scroll-mt-20">
        <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Get in Touch
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
                Have questions? We'd love to hear from you.
            </p>
        </div>
        <Card className="max-w-3xl mx-auto glass-card p-8">
            <form action="#" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="name" name="name" type="text" placeholder="John Doe" className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                         <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="email" name="email" type="email" placeholder="you@example.com" className="pl-10"/>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-muted-foreground">Message</label>
                    <Textarea id="message" name="message" rows={5} placeholder="Your message..." />
                </div>
                <div>
                    <Button type="submit" className="w-full" size="lg">
                        Send Message <Send className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </form>
        </Card>
      </section>

    </div>
  );
}

function FeatureCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  const isExternal = href.startsWith('http');
  const CardContent = (
    <Card className="glass-card p-8 text-center items-center flex flex-col h-full hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-2">
      <div className="mb-4">{icon}</div>
      <h3 className="font-headline text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground flex-grow">{description}</p>
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