import React, { useState } from 'react';

const StopVMButton = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleStopVM = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/stopVM`, {
                method: 'POST', // Ensure the method matches your function's HTTP trigger setup
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();
            setStatus(result.message);
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleStopVM} disabled={loading}>
                {loading ? 'Stopping VM...' : 'Stop VM'}
            </button>
            {status && <p>{status}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default StopVMButton;
