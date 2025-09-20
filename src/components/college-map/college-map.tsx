"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Globe, Calendar, Users, GraduationCap } from "lucide-react";

interface Coordinates {
  lat: number;
  long: number;
}

interface Institute {
  name: string;
  abbreviation?: string;
  type: string;
  location: string;
  coordinates?: Coordinates;
  website?: string;
  established?: number;
  description?: string;
  admissions?: {
    undergraduate?: string;
    postgraduate?: string;
  };
  departments?: {
    engineering?: string[];
    physical_sciences?: string[];
    [key: string]: any;
  };
  academic_programs?: string[];
  degrees_offered?: {
    btech?: string[];
    mtech?: string[];
    mtech_executive?: string[];
    phd?: string[];
    [key: string]: any;
  };
  courses_offered?: string[] | {
    undergraduate?: string[];
    postgraduate?: string[];
    doctoral?: string[];
    other?: string[];
    [key: string]: any;
  };
  contact?: any;
  other_programs?: string[];
}

export function CollegeMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load institutes data
  useEffect(() => {
    const loadInstitutes = async () => {
      try {
        const response = await fetch('/directory.json');
        if (!response.ok) {
          throw new Error('Failed to load institutes data');
        }
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON file but received: ${text.substring(0, 100)}...`);
        }
        
        const data: Institute[] = await response.json();
        setInstitutes(data);
      } catch (err) {
        setError('Failed to load institutes data');
        console.error('Error loading institutes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInstitutes();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google || institutes.length === 0) return;

    const initMap = () => {
      if (!mapRef.current) return;

      // Default center (Kashmir/Jammu region)
      const center = { lat: 33.2778, lng: 75.3412 };
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 8,
        center,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        gestureHandling: 'cooperative',
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      });

      setMap(mapInstance);

      // Add markers for each institute
      institutes.forEach((institute) => {
        if (!institute.coordinates) return;
        
        const lat = institute.coordinates.lat;
        const lng = institute.coordinates.long;

        if (isNaN(lat) || isNaN(lng)) return;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: institute.name,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="#FFFFFF"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
          }
        });

        marker.addListener('click', () => {
          setSelectedInstitute(institute);
        });
      });
    };

    initMap();
  }, [institutes]);

  // Load Google Maps API
  useEffect(() => {
    if (window.google) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      // Map will be initialized in the other useEffect
    };
    script.onerror = () => {
      setError('Failed to load Google Maps API');
    };
    
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading map</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px] lg:h-[calc(100vh-200px)]">
      {/* Map Container */}
      <div className="lg:w-[70%] w-full h-[400px] lg:h-full">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div ref={mapRef} className="w-full h-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="lg:w-[30%] w-full h-[500px] lg:h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Institute Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {selectedInstitute ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    {selectedInstitute.name}
                  </h3>
                  {selectedInstitute.abbreviation && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedInstitute.abbreviation}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {selectedInstitute.type}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-gray-500" />
                    <div className="text-sm">
                      <p className="text-gray-600 dark:text-gray-300">{selectedInstitute.location}</p>
                    </div>
                  </div>

                  {selectedInstitute.established && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Established: {selectedInstitute.established}</span>
                    </div>
                  )}

                  {selectedInstitute.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <a 
                        href={selectedInstitute.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <Separator />

                {selectedInstitute.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedInstitute.description}
                    </p>
                  </div>
                )}

                {selectedInstitute.academic_programs && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Academic Programs</h4>
                      <div className="space-y-1">
                        {selectedInstitute.academic_programs.map((program, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                            {program}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedInstitute.courses_offered && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Courses Offered</h4>
                      <div className="space-y-1">
                        {Array.isArray(selectedInstitute.courses_offered) ? (
                          selectedInstitute.courses_offered.map((course, index) => (
                            <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                              {course}
                            </Badge>
                          ))
                        ) : (
                          Object.entries(selectedInstitute.courses_offered).map(([category, courses]) => (
                            <div key={category} className="mb-3">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                                {category.replace(/_/g, ' ')}
                              </h5>
                              <div className="space-y-1">
                                {Array.isArray(courses) && courses.map((course: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                    {course}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {selectedInstitute.degrees_offered && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Degrees Offered</h4>
                      {Object.entries(selectedInstitute.degrees_offered).map(([degreeType, degrees]) => (
                        <div key={degreeType} className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase">
                            {degreeType.replace(/_/g, ' ')}
                          </h5>
                          <div className="space-y-1">
                            {Array.isArray(degrees) && degrees.map((degree: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                {degree}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedInstitute.departments && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Departments</h4>
                      {Object.entries(selectedInstitute.departments).map(([category, depts]) => (
                        <div key={category} className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                            {category.replace(/_/g, ' ')}
                          </h5>
                          <div className="space-y-1">
                            {Array.isArray(depts) && depts.map((dept: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedInstitute.admissions && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Admissions</h4>
                      <div className="text-sm space-y-1">
                        {selectedInstitute.admissions.undergraduate && (
                          <p><span className="font-medium">Undergraduate:</span> {selectedInstitute.admissions.undergraduate}</p>
                        )}
                        {selectedInstitute.admissions.postgraduate && (
                          <p><span className="font-medium">Postgraduate:</span> {selectedInstitute.admissions.postgraduate}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {selectedInstitute.other_programs && selectedInstitute.other_programs.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Other Programs</h4>
                      <div className="space-y-1">
                        {selectedInstitute.other_programs.map((program, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                            {program}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedInstitute.contact && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="text-sm space-y-1">
                        {selectedInstitute.contact.address && (
                          <p><span className="font-medium">Address:</span> {selectedInstitute.contact.address}</p>
                        )}
                        {selectedInstitute.contact.phone && (
                          <p><span className="font-medium">Phone:</span> {selectedInstitute.contact.phone}</p>
                        )}
                        {selectedInstitute.contact.email && (
                          <p><span className="font-medium">Email:</span> {selectedInstitute.contact.email}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-center p-4">
                <div>
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">
                    <span className="hidden lg:inline">Click</span>
                    <span className="lg:hidden">Tap</span> on a college marker to view details.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
