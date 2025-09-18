"use client";

import { CollegeMap } from "@/components/college-map/college-map";

export default function CollegeMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="mb-4 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 lg:mb-4">
            College & Institute Finder
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-lg">
            Discover colleges and institutes near you. Click on any marker to view detailed information.
          </p>
        </div>
        
        <CollegeMap />
      </div>
    </div>
  );
}
