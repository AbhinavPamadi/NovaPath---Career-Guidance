# College Map Feature Setup

## Overview
The College Map feature displays nearby colleges and institutes on an interactive Google Map with detailed information in a sidebar panel.

## Setup Instructions

### 1. Google Maps API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Maps JavaScript API"
4. Create an API key with restrictions (HTTP referrers for your domain)
5. Replace `your_google_maps_api_key_here` in `.env.local` with your actual API key

### 2. Environment Variables
Create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Data Management
- College data is stored in `public/directory.json`
- Each institute must have coordinates in the format: "latitude": "34°7′30″N", "longitude": "74°50′23″E"
- The component automatically parses these coordinates for map markers

## Features
- Interactive Google Map with custom markers
- Responsive design (mobile-friendly)
- Detailed sidebar with institute information
- Automatic data fetching from JSON file
- Clean, modern UI matching the site theme

## File Structure
```
src/
├── app/college-map/
│   └── page.tsx
├── components/college-map/
│   ├── index.ts
│   └── college-map.tsx
└── components/layout/
    └── nav-links.tsx (updated)

public/
└── directory.json (college data)
```

## Responsive Behavior
- Desktop: Map (70%) + Sidebar (30%) side by side
- Mobile/Tablet: Map on top, sidebar below
- Optimized for touch interactions on mobile devices
