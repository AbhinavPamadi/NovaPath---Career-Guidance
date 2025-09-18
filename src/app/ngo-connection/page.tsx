import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Briefcase, 
  GraduationCap, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Heart,
  Users,
  Award,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

// Data structures for better organization
const ngoData = [
  {
    id: 1,
    name: "Sahuliyat Kashmir",
    description: "Provides quality education up to 12th grade for students facing financial constraints. Offers scholarships, school materials, and parental counseling.",
    focus: "Educational Support",
    website: "https://www.sahuliyatkashmir.com/",
    email: "sahuliyatkashmir@gmail.com",
    phone: "+91 70069 7584",
    established: "2015",
    beneficiaries: "500+ Students"
  },
  {
    id: 2,
    name: "CHINAR International",
    description: "Dedicated to supporting orphans and vulnerable children, helping them attain quality education and reach their full potential.",
    focus: "Child Welfare",
    website: "https://www.chinarinternational.org/",
    established: "2010",
    beneficiaries: "1000+ Children"
  },
  {
    id: 3,
    name: "Helpline Humanity",
    description: "Operating for over 20 years, focusing on various community initiatives including educational support for students in need.",
    focus: "Community Development",
    website: "https://www.facebook.com/helplinehumanity/",
    established: "2003",
    beneficiaries: "2000+ Community Members"
  },
  {
    id: 4,
    name: "Kashmir Lifeline (KLL)",
    description: "Offers counseling services by professional counselors, clinical psychologists, and educationists for academic and personal challenges.",
    focus: "Mental Health & Counseling",
    website: "https://kashmirlifeline.org/",
    phone: "1800 180 70 20",
    email: "kashmirlifeline@kashmirlifeline.org",
    established: "2008",
    beneficiaries: "3000+ Individuals"
  }
];

const careerServices = [
  {
    id: 1,
    name: "Mindgroom Career Guidance",
    description: "Comprehensive career counseling services including aptitude assessments, career mapping, and guidance on subject selection.",
    services: ["Aptitude Assessment", "Career Mapping", "Subject Selection"],
    website: "https://www.mindgroom.com/",
    location: "Jammu & Kashmir",
    established: "2012"
  },
  {
    id: 2,
    name: "University of Kashmir – CCPC",
    description: "Provides career guidance, coaching for competitive examinations, skill development, and placement support.",
    services: ["Career Guidance", "Competitive Exam Coaching", "Skill Development", "Placement Support"],
    website: "https://ccpc.uok.edu.in/",
    phone: "0194-2272265",
    email: "contactccpc@uok.edu.in",
    location: "Srinagar, Kashmir",
    established: "2004"
  },
  {
    id: 3,
    name: "Chenab Career Educational Trust",
    description: "Offers affordable educational services including career counseling and guidance for higher education pursuits.",
    services: ["Career Counseling", "Higher Education Guidance", "Educational Planning"],
    website: "https://www.justdial.com/j/chenab-career-educational-trust/Jammu/9999PX191-X191-180720173204-J2V4_BZDET",
    location: "Jammu",
    established: "2009"
  }
];

export default function NGOConnectionPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline holographic-text">
          NGO & Career Services
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Connect with organizations making real-world impact and access professional career guidance services.
        </p>
      </div>

      {/* NGO Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="text-primary h-8 w-8" />
          <h2 className="text-3xl font-bold font-headline">NGOs Supporting Students</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ngoData.map((ngo) => (
            <Card key={ngo.id} className="glass-card hover:border-accent/50 transition-all duration-300 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline text-foreground">{ngo.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {ngo.focus}
                    </Badge>
                  </div>
                  <Users className="text-primary h-6 w-6 mt-1" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{ngo.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Est. {ngo.established}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{ngo.beneficiaries}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {ngo.website && (
                    <Button asChild variant="outline" size="sm" className="w-full justify-between">
                      <Link href={ngo.website} target="_blank" rel="noopener noreferrer">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Visit Website
                        </div>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {ngo.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{ngo.phone}</span>
                      </div>
                    )}
                    {ngo.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{ngo.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Career Services Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="text-primary h-8 w-8" />
          <h2 className="text-3xl font-bold font-headline">Professional Career Services</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {careerServices.map((service) => (
            <Card key={service.id} className="glass-card hover:border-accent/50 transition-all duration-300 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-headline text-foreground leading-tight">
                      {service.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{service.location}</span>
                    </div>
                  </div>
                  <Briefcase className="text-primary h-6 w-6 mt-1" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Services Offered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {service.services.map((serviceItem, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                        {serviceItem}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Award className="h-3 w-3 text-primary" />
                  <span>Established {service.established}</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  {service.website && (
                    <Button asChild variant="outline" size="sm" className="w-full justify-between">
                      <Link href={service.website} target="_blank" rel="noopener noreferrer">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Learn More
                        </div>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {service.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{service.phone}</span>
                      </div>
                    )}
                    {service.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{service.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="mt-16 text-center">
        <Card className="glass-card p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold font-headline mb-4">Need Help Getting Started?</h3>
          <p className="text-muted-foreground mb-6">
            Not sure which organization or service is right for you? Our AI assistant can help you find the perfect match based on your needs and location.
          </p>
          <Button size="lg" className="shadow-primary/50 shadow-lg hover:shadow-primary/50 hover:shadow-2xl transition-shadow">
            Get Personalized Recommendations
          </Button>
        </Card>
      </section>
    </div>
  );
}
