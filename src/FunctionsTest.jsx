import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { api } from '/src/utils/api';

const FunctionsTest = () => {

    // Function to sign and call awaitVMStatus
    const awaitVMStatus = async (targetStatus, timeout = 50) => {
        const payload = { target: targetStatus, timeout };
    
        try {
            const status = await api.get(`${import.meta.env.VITE_API_URL}/awaitVMStatus`, payload);
            return status;
        } catch (error) {
            console.error("Failed to get VM Status");
            throw error; // Rethrow error for further handling
        }
    };

    // Handler for button click
    const handleButtonClick = async () => {
        try {
            const status = await awaitVMStatus('TARGET_STATUS'); // Replace 'TARGET_STATUS' with the actual target
            console.log("VM Status:", status);
        } catch (error) {
            console.error("Failed to get VM Status");
        }
    };

    return (
        <div>
            <button onClick={handleButtonClick}>Check VM Status</button>
        </div>
    );
};

export default FunctionsTest;
