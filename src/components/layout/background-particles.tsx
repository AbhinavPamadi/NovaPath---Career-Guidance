"use client";

import React, { useState, useEffect } from 'react';

interface ParticleStyle {
  left: string;
  top: string;
  width: string;
  height: string;
  animation: string;
  animationDelay: string;
}

export function BackgroundParticles() {
  const [particleStyles, setParticleStyles] = useState<ParticleStyle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const generateStyles = () => {
      return Array.from({ length: 50 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        animation: `float ${Math.random() * 20 + 10}s ease-in-out infinite`,
        animationDelay: `${Math.random() * -30}s`,
      }));
    };
    setParticleStyles(generateStyles());
  }, []);

  // Don't render particles until mounted on client
  if (!isMounted) {
    return <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {particleStyles.map((style, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={style}
        />
      ))}
    </div>
  );
}
