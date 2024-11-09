import axios from 'axios';
import CryptoJS from 'crypto-js';

// Set the secret key from environment variables
const secretKey = import.meta.env.VITE_API_KEY;

// Utility object for API requests
export const api = {
    // Function to stringify the payload
    stringifyPayload: (payload) => {
        const result = {};
        for (let key in payload) {
            if (payload.hasOwnProperty(key)) {
                result[key] = String(payload[key]); // Explicitly convert each value to a string
            }
        }
        return result;
    },

    // Function to make GET requests with HMAC SHA256 signature
    get: async (url, payload) => {
        try {
            // Stringify the payload inside the API object
            const payloadString = JSON.stringify(api.stringifyPayload(payload));

            const orderedPayload = {};
            const sortedKeys = Object.keys(payload).sort();
            
            // Sort the payload keys
            sortedKeys.forEach(key => {
                orderedPayload[key] = payload[key];
            });

            // Generate HMAC signature
            const hmac = CryptoJS.HmacSHA256(payloadString, secretKey);
            const signature = hmac.toString(CryptoJS.enc.Hex);

            // Make the GET request with the signature in the headers
            const response = await axios.get(url, {
                params: orderedPayload,
                headers: {
                    'X-Signature': signature,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
            throw error; // Propagate the error to handle it in the calling function
        }
    },
};
