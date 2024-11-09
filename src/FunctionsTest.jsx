import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const FunctionsTest = () => {
    const secretKey = import.meta.env.VITE_API_KEY;

    const stringifyPayload = (payload) => {
        const result = {};
        for (let key in payload) {
            if (payload.hasOwnProperty(key)) {
                result[key] = String(payload[key]); // Explicitly convert each value to a string
            }
        }
        return result;
    };

    // Function to sign and call awaitVMStatus
    const awaitVMStatus = async (targetStatus, timeout = 50) => {
        try {
            // Prepare payload and create signature
            const payload = stringifyPayload({ target: targetStatus, timeout });
            const orderedPayload = {};
            Object.keys(payload).sort().forEach(key => {
                orderedPayload[key] = payload[key];
            });
        
            const payloadString = JSON.stringify(orderedPayload);

            console.log("Payload:", payloadString);

            const hmac = CryptoJS.HmacSHA256(payloadString, secretKey);
            const signature = hmac.toString(CryptoJS.enc.Hex);
        
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/awaitVMStatus`, {
                params: orderedPayload,
                headers: {
                    'X-Signature': signature,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
            // Assuming pushVmState is available in scope to handle errors
            pushVmState('ERROR');
            throw error;
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
