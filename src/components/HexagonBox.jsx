import React, {useRef, useEffect} from 'react';

const HexagonBox = ({ children, borderRadius = 12, backgroundColor = "#fff", borderColor = "#ccc", height = "initial" }) => {

    let offset, borderWidth;
    if (borderRadius == 12) {
        offset = -borderRadius + borderRadius / 36;
        borderWidth = 1 - borderRadius / 18;
    }
    else if (borderRadius == 4 && borderColor != "transparent") {
        offset = -borderRadius + 0.5;
        borderWidth = 1;
    } else {
        offset = -borderRadius;
        borderWidth = 0;
    }

    const widthRef = useRef(null);
    var width = widthRef.current?.offsetWidth || 0;

    useEffect(() => {
        if (widthRef.current) {
          const width = widthRef.current.offsetWidth;
          console.log('Width of div:', width);
        }
      }, [widthRef]);


  return (
    <div 
      style={{ 
        position: "relative", 
        width: "fit-content",
        padding: `${4 * borderRadius - borderRadius / 36}px 0`,
        display: "flex",
        flexDirection: "column",
          justifyContent: "center",
          
      }}
    >
      
      {/* Top Left Corner */}
      <svg 
        style={{ position: "absolute", top: offset, left: offset }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M15.9928 4.00571L14.1 4.00571C12.0203 3.91307 9.96151 4.95022 8.84065 6.87589L5.3494 12.8739V12.8872C4.48659 14.3796 3.99268 16.1128 3.99268 17.9616C3.99268 18.0898 3.99505 18.2175 3.99976 18.3445H3.99279V20.0097L15.9928 20.0097V4.00571Z" 
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      </svg>

      {/* Top Right Corner */}
      <svg 
        style={{ position: "absolute", top: offset, right: offset }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M28.0072 4.00571L29.9 4.00571C31.9797 3.91307 34.0385 4.95022 35.1594 6.87589L38.6506 12.8739V12.8872C39.5134 14.3796 40.0073 16.1128 40.0073 17.9616C40.0073 18.0898 40.0049 18.2175 40.0002 18.3445H40.0072V20.0097L28.0072 20.0097V4.00571Z" 
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      </svg>

      {/* Bottom Left Corner */}
      <svg 
        style={{ position: "absolute", bottom: offset, left: offset }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M15.9928 35.9943L14.1 35.9943C12.0203 36.0869 9.96151 35.0498 8.84065 33.1241L5.3494 27.1261V27.1128C4.48659 25.6204 3.99268 23.8872 3.99268 22.0384C3.99268 21.9102 3.99505 21.7825 3.99976 21.6555H3.99279V19.9903L15.9928 19.9903V35.9943Z" 
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      </svg>

      {/* Bottom Right Corner */}
      <svg 
        style={{ position: "absolute", bottom: offset, right: offset }}
        width={11 * borderRadius}
        height={10 * borderRadius}
        viewBox="0 0 44 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M28.0072 35.9943L29.9 35.9943C31.9797 36.0869 34.0385 35.0498 35.1594 33.1241L38.6506 27.1261V27.1128C39.5134 25.6204 40.0073 23.8872 40.0073 22.0384C40.0073 21.9102 40.0049 21.7825 40.0002 21.6555H40.0072V19.9903L28.0072 19.9903V35.9943Z" 
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      </svg>

      {/* Top rectangle fill between corners */}
      <div 
        style={{ 
          backgroundColor,  
          height: `${4 * borderRadius}px`, 
          position: "absolute", 
          top: 0, 
          left: borderRadius * 3 - borderRadius / 36,
          right: borderRadius * 3 - borderRadius / 36,
          borderTop: `1px solid ${borderColor}`
        }}
      ></div>

      {/* Bottom rectangle fill between corners */}
      <div 
        style={{ 
          backgroundColor, 
          height: `${4 * borderRadius}px`, 
          position: "absolute", 
          bottom: 0, 
          left: borderRadius * 3 - borderRadius / 36,
          right: borderRadius * 3 - borderRadius / 36,
          borderBottom: `1px solid ${borderColor}`
        }}
      ></div>

      <div 
        style={{
            position: "absolute",
            top: `${4 * borderRadius}px`,
            left: 0,
            right: 0,
            bottom: `${4 * borderRadius}px`,
            backgroundColor: backgroundColor,
            borderLeft: `1px solid ${borderColor}`, 
            borderRight: `1px solid ${borderColor}`,
            zIndex: 2,
            }}
        ></div>

      {/* Content Container */}
      <div 
      ref={widthRef}
        style={{ 
          zIndex:3,
          margin: `${-borderRadius * 3}px 0`,
          backgroundColor: "transparent",
          display: "inline"
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default HexagonBox;
