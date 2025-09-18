"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Globe, Calendar, Users, GraduationCap } from "lucide-react";

interface Coordinates {
  latitude: string;
  longitude: string;
}

interface Location {
  city: string;
  region: string;
  postal_code?: string;
  country: string;
  coordinates: Coordinates;
}

interface Admissions {
  undergraduate?: string;
  postgraduate?: any;
  doctoral_programs?: string[];
}

interface Institute {
  name: string;
  abbreviation: string;
  type: string;
  established?: number;
  location: Location;
  website: string;
  overview: string;
  admissions?: Admissions;
  departments?: any;
  academic_programs?: string[];
  student_intake?: any;
  executive_and_certificate_programs?: string[];
}

interface DirectoryData {
  institutes: Institute[];
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
        const data: DirectoryData = await response.json();
        setInstitutes(data.institutes);
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

      // Default center (India)
      const center = { lat: 28.6139, lng: 77.2090 };
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 6,
        center,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMap(mapInstance);

      // Add markers for each institute
      institutes.forEach((institute) => {
        const lat = parseFloat(institute.location.coordinates.latitude.replace(/[°′″NSEW]/g, ''));
        const lng = parseFloat(institute.location.coordinates.longitude.replace(/[°′″NSEW]/g, ''));

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

  const parseCoordinate = (coord: string): number => {
    return parseFloat(coord.replace(/[°′″NSEW]/g, ''));
  };

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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Map Container */}
      <div className="lg:w-[70%] w-full h-64 lg:h-full">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div ref={mapRef} className="w-full h-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="lg:w-[30%] w-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Institute Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedInstitute ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    {selectedInstitute.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedInstitute.abbreviation}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {selectedInstitute.type}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-gray-500" />
                    <div className="text-sm">
                      <p>{selectedInstitute.location.city}, {selectedInstitute.location.region}</p>
                      <p className="text-gray-600 dark:text-gray-400">{selectedInstitute.location.country}</p>
                      {selectedInstitute.location.postal_code && (
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedInstitute.location.postal_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedInstitute.established && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Established: {selectedInstitute.established}</span>
                    </div>
                  )}

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

                  {selectedInstitute.student_intake && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        MBA Intake: {selectedInstitute.student_intake.MBA} ({selectedInstitute.student_intake.year})
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Overview</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedInstitute.overview}
                  </p>
                </div>

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

                {selectedInstitute.departments && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Departments</h4>
                      {selectedInstitute.departments.engineering && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Engineering</h5>
                          <div className="space-y-1">
                            {selectedInstitute.departments.engineering.map((dept: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedInstitute.departments.sciences_and_humanities && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sciences & Humanities</h5>
                          <div className="space-y-1">
                            {selectedInstitute.departments.sciences_and_humanities.map((dept: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
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
                          <p><span className="font-medium">UG:</span> {selectedInstitute.admissions.undergraduate}</p>
                        )}
                        {selectedInstitute.admissions.postgraduate && (
                          <div>
                            <span className="font-medium">PG:</span>
                            {typeof selectedInstitute.admissions.postgraduate === 'object' ? (
                              <ul className="ml-4 mt-1">
                                {Object.entries(selectedInstitute.admissions.postgraduate).map(([key, value]) => (
                                  <li key={key} className="text-xs">
                                    <span className="font-medium">{key}:</span> {value as string}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span> {selectedInstitute.admissions.postgraduate}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-center">
                <div>
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Click on a college marker to view details.
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
