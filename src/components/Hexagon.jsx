import React, { useEffect, useState } from 'react';
import headshot from '/src/assets/headshot2.jpg';
import './Hexagon.scss'; // Import the SCSS file

const Hexagon = ({ size = 200, pulsing = false, spinning = false, clickable = false }) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let intervalId;

    if (spinning) {
      intervalId = setInterval(() => {
        setRotation((prevRotation) => prevRotation + 60);
      }, 900);
    }

    return () => {
      clearInterval(intervalId); // Clear the interval on component unmount
    };
  }, [spinning]); // Re-run the effect if the spinning prop changes

  const handleClick = () => {
    if (clickable) {
      setRotation((prevRotation) => prevRotation + 60);
    }
  };

  return (
    <div className={`hexagon-container ${pulsing ? 'pulsing' : ''}`}>
      <div
        className={`hexagon size-${size}`} // Apply dynamic size class
        style={{ transform: `rotate(${rotation}deg)` }} // Rotation handled inline
        onClick={handleClick} // Add click handler
      >
        <img 
          src={headshot} 
          alt="headshot" 
          className="img" 
          style={{ transform: `translate(-50%, -50%) rotate(${-rotation}deg)` }} // Keep image upright
        />
      </div>
    </div>
  );
};

export default Hexagon;





