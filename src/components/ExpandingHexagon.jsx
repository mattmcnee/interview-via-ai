import React, { useState } from 'react';

const ExpandingHexagon = ({
  backgroundColor = "#000000",
  text = "Button",
  textWidth = 100,
  size = 80,
  rotation = 0,
  isExpanded = true,
  action
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const width = size + size / 10;
  const height = size;
  const hexagonCenterX = width / 2;
  const hexagonCenterY = height / 2;

  const shadowFilter = (id) => (
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feOffset result="offOut" in="SourceGraphic" dx="0" dy="0" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
        <feFlood floodColor="red" result="floodFill" />
        <feComposite in="floodFill" in2="blurOut" operator="in" result="coloredShadow"/>
        <feMerge>
          <feMergeNode in="coloredShadow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  );

  const leftPath = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 44 40`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transformOrigin: `${hexagonCenterX}px ${hexagonCenterY}px`,
        marginRight: `-${width/2 + 1}px`
      }}
    >
      {shadowFilter("shadow-left")}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 36.0007H15.1069L15.08 36.0006C13.6771 36.0276 12.3015 35.3143 11.5442 34.0161L4.58378 22.0839C4.49805 21.9431 4.42137 21.7975 4.35398 21.648C4.11338 21.1173 3.99818 20.556 3.9987 20.0007C3.99818 19.4453 4.11339 18.8839 4.35402 18.3532C4.42139 18.2038 4.49806 18.0582 4.58377 17.9174L11.5442 5.98517C12.3015 4.68703 13.6771 3.97371 15.0801 4.00074L15.1069 4.00065H22V36.0007Z"
        fill={backgroundColor}
        filter="url(#shadow-left)"
      />
    </svg>
  );

  const rightPath = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 44 40`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transformOrigin: `${hexagonCenterX}px ${hexagonCenterY}px`,
        marginLeft: `-${width/2 + 1}px`
      }}
    >
      {shadowFilter("shadow-right")}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 36.0007H28.8931L28.92 36.0006C30.3229 36.0276 31.6985 35.3143 32.4558 34.0161L39.4162 22.0839C39.5019 21.9431 39.5786 21.7975 39.646 21.648C39.8866 21.1173 40.0018 20.556 40.0013 20.0007C40.0018 19.4453 39.8866 18.8839 39.646 18.3532C39.5786 18.2038 39.5019 18.0582 39.4162 17.9174L32.4558 5.98517C31.6985 4.68703 30.3229 3.97371 28.9199 4.00074L28.8931 4.00065H22V36.0007Z"
        fill={backgroundColor}
        filter="url(#shadow-right)"
      />
    </svg>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: isExpanded ? 'pointer' : 'initial',
        transition: 'all 0.3s ease',
        transform: `rotate(${rotation}deg) scale(${isHovered && isExpanded ? 1.03 : 1})`,
        transformOrigin: `${hexagonCenterX}px ${hexagonCenterY}px`,
        margin: '5px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isExpanded) {
          action();
        }
      }}
    >
      {leftPath}
      <div
        style={{
          width: isExpanded ? `${textWidth}px` : '0px',
          height: size - size / 5,
          backgroundColor: backgroundColor,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fcfcfc',
          zIndex: 2,
          position: 'relative',
          // Add pseudo-element shadows only to top and bottom
          boxShadow: '0px 4px 4px -2px rgba(255, 0, 0, 0.5), 0px -4px 4px -2px rgba(255, 0, 0, 0.5)'
        }}
      >
        <div
          style={{
            transition: 'all 0.3s ease',
            opacity: isExpanded ? 1 : 0,
            minWidth: `100px`,
            zIndex: 2,
            fontWeight: '400'
          }}
        >
          {text}
        </div>
      </div>
      {rightPath}
    </div>
  );
};

export default ExpandingHexagon;