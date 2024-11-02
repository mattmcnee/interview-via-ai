import React, { useState } from 'react';
import axios from 'axios';

const StartVMButton = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleStartVM = async () => {
        setLoading(true);
        setMessage('');
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/startVM`); // Replace with your function's URL
            const { success, message, status } = response.data;

            if (success) {
                setMessage(`Success: ${message} (Status: ${status})`);
            } else {
                setMessage(`Failed: ${message}`);
            }
        } catch (error) {
            console.error('Error starting VM:', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleStartVM} disabled={loading}>
                {loading ? 'Starting VM...' : 'Start VM'}
            </button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default StartVMButton;
