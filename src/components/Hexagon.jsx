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
        <svg viewBox="0 0 36 32"
         className={`hexagon size-${size}`} // Apply dynamic size class
        style={{ transform: `rotate(${rotation}deg)` }} // Rotation handled inline
        onClick={handleClick} // Add click handler
        >
          <defs>
            <clipPath id="shield-clip">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.585101 18.084C0.499309 17.943 0.422573 17.7973 0.355145 17.6477C0.114639 17.1171 -0.000519959 16.5558 1.76463e-06 16.0007C-0.000519959 15.4455 0.114639 14.8842 0.355145 14.3536C0.422573 14.204 0.499309 14.0583 0.585101 13.9173L7.50731 2.0507C7.58347 1.91454 7.66737 1.7833 7.7584 1.65756C8.09874 1.18542 8.52761 0.806787 9.0085 0.531252C9.48789 0.255392 10.0298 0.0760325 10.6078 0.0196952C10.7632 0.00423613 10.9197 -0.00218353 11.0766 0.000652699H24.8931L24.92 0.000740914C26.3229 -0.0262857 27.6985 0.687033 28.4558 1.98517L35.4162 13.9174C35.5019 14.0582 35.5786 14.2038 35.646 14.3532C35.8866 14.884 36.0018 15.4453 36.0013 16.0007C36.0018 16.556 35.8866 17.1174 35.646 17.6481C35.5786 17.7975 35.5019 17.9431 35.4162 18.0839L28.4558 30.0161C27.6985 31.3143 26.3229 32.0276 24.92 32.0006L24.8931 32.0007H11.0766C10.9198 32.0035 10.7633 31.9971 10.608 31.9816C10.0299 31.9253 9.48787 31.7459 9.00844 31.47C8.52697 31.1941 8.09766 30.8149 7.75713 30.342C7.66658 30.2168 7.5831 30.0861 7.50729 29.9506L0.585101 18.084Z" />
            </clipPath>
          </defs>
          
          <image
            href={headshot} 
            className="img" 
            clipPath="url(#shield-clip)"
            style={{ transform: `rotate(${-rotation}deg)` }}
          />
        </svg>
    </div>
  );
};

export default Hexagon;





