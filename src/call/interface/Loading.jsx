import React, { useEffect } from 'react';

const Loading = ({ setMeetingState }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            setMeetingState('meeting');
        }, 2000);

        return () => clearTimeout(timer);
    }, [setMeetingState]);

    return (
        <div>
            <h1>Loading...</h1>
            <p>Please wait while we prepare your audio call.</p>
        </div>
    );
};

export default Loading;