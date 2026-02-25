"use client";

import React, { useEffect, useState } from "react";

export function Starfield() {
    const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: number }[]>([]);

    useEffect(() => {
        // Generate stars only on the client to avoid hydration mismatch
        const generateStars = () => {
            const generatedStars = [];
            const numStars = window.innerWidth < 768 ? 50 : 150; // Fewer stars on mobile

            for (let i = 0; i < numStars; i++) {
                generatedStars.push({
                    id: i,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    size: Math.random() * 2 + 1, // 1px to 3px
                    duration: Math.random() * 3 + 2, // 2s to 5s animation
                });
            }
            setStars(generatedStars);
        };

        generateStars();

        // Optional: Regenerate on resize if desired, but skip for performance unless needed
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute bg-white rounded-full opacity-0 animate-twinkle"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDuration: `${star.duration}s`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        </div>
    );
}
