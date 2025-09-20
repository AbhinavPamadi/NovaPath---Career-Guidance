// Campus and College Data for NovaPath Career Guidance
// This file exports interfaces and data for educational institutions

export interface Coordinates {
  lat: number;
  long: number;
}

export interface Institute {
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
  affiliation?: string;
  seat_intake?: string;
}

// Campus data is loaded from public/directory.json
// This file provides type definitions and utility functions

export const INSTITUTE_TYPES = [
  'Engineering / Technical University',
  'Management / Business School',
  'Medical University',
  'Medical College',
  'University',
  'Degree College',
  'Postgraduate College',
  'Engineering College',
  'Media / Mass Communication',
  'Law School'
] as const;

export type InstituteType = typeof INSTITUTE_TYPES[number];

// Utility function to load institutes from JSON
export async function loadInstitutes(): Promise<Institute[]> {
  try {
    const response = await fetch('/directory.json');
    if (!response.ok) {
      throw new Error('Failed to load institutes data');
    }
    const data: Institute[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading institutes:', error);
    throw error;
  }
}

// Utility function to filter institutes by type
export function filterInstitutesByType(institutes: Institute[], type: InstituteType): Institute[] {
  return institutes.filter(institute => institute.type === type);
}

// Utility function to search institutes by name or location
export function searchInstitutes(institutes: Institute[], query: string): Institute[] {
  const lowercaseQuery = query.toLowerCase();
  return institutes.filter(institute => 
    institute.name.toLowerCase().includes(lowercaseQuery) ||
    institute.location.toLowerCase().includes(lowercaseQuery) ||
    (institute.abbreviation && institute.abbreviation.toLowerCase().includes(lowercaseQuery))
  );
}

// Utility function to get institutes with coordinates
export function getInstitutesWithCoordinates(institutes: Institute[]): Institute[] {
  return institutes.filter(institute => 
    institute.coordinates && 
    !isNaN(institute.coordinates.lat) && 
    !isNaN(institute.coordinates.long)
  );
}

export default {
  INSTITUTE_TYPES,
  loadInstitutes,
  filterInstitutesByType,
  searchInstitutes,
  getInstitutesWithCoordinates
};