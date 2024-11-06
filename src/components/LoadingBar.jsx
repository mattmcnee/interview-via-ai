import React, { useState, useEffect, useRef } from 'react';
import ExpandingHexagon from './ExpandingHexagon';

const LoadingBar = ({ message = "Initialising VM", isLoading = true, action }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [rotation, setRotation] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Clear any existing interval when the component mounts or the isLoading prop changes
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (isLoading) {
            // Set a new interval to update the rotation
            intervalRef.current = setInterval(() => {
                setRotation(prevRotation => (prevRotation + 60)); // rotate by 60 degrees as a hexagon has 6 sides
            }, Math.random() * 1200 + 100); // random interval between 100ms and 1300ms
        } else {
            // Clear the rotation when loading is false
            setRotation(prev => {
                const newRotation = prev + 60;
                return Math.ceil(newRotation / 360) * 360;
            });
        }

        // Clean up the interval when the component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading) {
            // Set the width to 100 after 0.5 seconds when loading is false
            const timer = setTimeout(() => {
                setIsExpanded(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsExpanded(false);
        }
    }, [isLoading]);

    return (
        <>
            <div style={{ width: "100%", height: "calc(60px + 10px)", position: "relative" }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: isLoading ? 0 : '100%', // move to the right edge when loading is false
                    transform: isLoading ? 'translateX(0)' : 'translateX(calc(-100% - 1px))',
                    transition: 'left 1s ease, transform 1s ease',
                    zIndex: 2
                }}>
                    <ExpandingHexagon text={"Start Meeting"} textWidth={100} isExpanded={isExpanded} size={60} rotation={rotation} action={action} />
                </div>
                <div style={{ 
                    marginLeft: "80px", 
                    display: 'flex', 
                    justifyContent: 'flex-start', 
                    alignItems: 'center', 
                    height: "60px",
                    opacity: isLoading ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                }}>
                    {message}
                </div>
            </div>
        </>
    );
};

export default LoadingBar;