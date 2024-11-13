import React from 'react';

const HexagonBox = ({ children, borderRadius = 12, backgroundColor = "grey" }) => {
  return (
    <div style={{ position: "relative", width: "200px", padding: `${4 * borderRadius}px 0`}}>
      
      {/* Top Left Corner */}
      <svg 
        style={{ position: "absolute", top: -borderRadius, left: -borderRadius }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M15.9928 4.00571L14.1 4.00571C12.0203 3.91307 9.96151 4.95022 8.84065 6.87589L5.3494 12.8739V12.8872C4.48659 14.3796 3.99268 16.1128 3.99268 17.9616C3.99268 18.0898 3.99505 18.2175 3.99976 18.3445H3.99279V20.0097L15.9928 20.0097V4.00571Z" 
          fill={backgroundColor}
        />
      </svg>

      {/* Top Right Corner */}
      <svg 
        style={{ position: "absolute", top: -borderRadius, right: -borderRadius }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M28.0072 4.00571L29.9 4.00571C31.9797 3.91307 34.0385 4.95022 35.1594 6.87589L38.6506 12.8739V12.8872C39.5134 14.3796 40.0073 16.1128 40.0073 17.9616C40.0073 18.0898 40.0049 18.2175 40.0002 18.3445H40.0072V20.0097L28.0072 20.0097V4.00571Z" 
          fill={backgroundColor}
        />
      </svg>

      {/* Bottom Left Corner */}
      <svg 
        style={{ position: "absolute", bottom: -borderRadius, left: -borderRadius }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M15.9928 35.9943L14.1 35.9943C12.0203 36.0869 9.96151 35.0498 8.84065 33.1241L5.3494 27.1261V27.1128C4.48659 25.6204 3.99268 23.8872 3.99268 22.0384C3.99268 21.9102 3.99505 21.7825 3.99976 21.6555H3.99279V19.9903L15.9928 19.9903V35.9943Z" 
          fill={backgroundColor}
        />
      </svg>

      {/* Bottom Right Corner */}
      <svg 
        style={{ position: "absolute", bottom: -borderRadius, right: -borderRadius }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M28.0072 35.9943L29.9 35.9943C31.9797 36.0869 34.0385 35.0498 35.1594 33.1241L38.6506 27.1261V27.1128C39.5134 25.6204 40.0073 23.8872 40.0073 22.0384C40.0073 21.9102 40.0049 21.7825 40.0002 21.6555H40.0072V19.9903L28.0072 19.9903V35.9943Z" 
          fill={backgroundColor}
        />
      </svg>

      {/* Top rectangle fill between corners */}
      <div style={{ backgroundColor: backgroundColor, width: `calc(100% - ${6 * borderRadius}px)`, height: `${4 * borderRadius}px`, position: "absolute", top: 0, left: borderRadius * 3 }}></div>
      {/* Bottom rectangle fill between corners */}
      <div style={{ backgroundColor: backgroundColor, width: `calc(100% - ${6 * borderRadius}px)`, height: `${4 * borderRadius}px`, position: "absolute", bottom: 0, left: borderRadius * 3 }}></div>

      {/* Content Container */}
      <div style={{ backgroundColor: backgroundColor, width: "100%", minHeight: "50px" }}>
        {children}
      </div>
    </div>
  );
};

export default HexagonBox;
