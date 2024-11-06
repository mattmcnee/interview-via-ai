import React, { useState } from 'react';
import LoadingBar from '/src/components/LoadingBar';

const LoadingPage = () => {
    const [loading, setLoading] = useState(true);

    const toggleLoading = () => {
        setLoading(!loading);
    };

    return (
        <div>
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