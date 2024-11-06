import React, { useState } from 'react';
import LoadingBar from '/src/components/LoadingBar';
import HexagonButton from '/src/components/HexagonButton';

const LoadingPage = () => {
    const [loading, setLoading] = useState(true);

    const toggleLoading = () => {
        setLoading(!loading);
    };

    return (
        <div>
            <HexagonButton fill={false} action={() => setMeetingState('entry')} content={<div>Back</div>} size={60} contentWidth={40} backgroundColor="#ccc" color="#000" />
            <LoadingBar
                message="Loading..."
                isLoading={loading}
            />
            <button onClick={toggleLoading}>
                {loading ? 'Stop Loading' : 'Start Loading'}
            </button>
        </div>
    );
};

export default LoadingPage;