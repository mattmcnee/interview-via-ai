import axios from 'axios';
import CryptoJS from 'crypto-js';

export const api = {
    // converts integer values to string
    stringifyPayload: (payload) => {
        const result = {};
        for (let key in payload) {
            if (payload.hasOwnProperty(key)) {
                result[key] = String(payload[key]);
            }
        }
        return result;
    },

    // abstracted axios GET request with HMAC signature
    get: async (url, payload) => {
        try {
            // get the secret key and convert payload to string
            const secretKey = import.meta.env.VITE_API_KEY;
            const payloadString = JSON.stringify(api.stringifyPayload(payload));

            // sort the payload keys alphabetically
            const orderedPayload = {};
            const sortedKeys = Object.keys(payload).sort();
            sortedKeys.forEach(key => {
                orderedPayload[key] = payload[key];
            });

            // generate HMAC signature
            const hmac = CryptoJS.HmacSHA256(payloadString, secretKey);
            const signature = hmac.toString(CryptoJS.enc.Hex);

            // make the GET request with the signature in the headers
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
            throw error;
        }
    },

    // abstracted axios POST request with HMAC signature
    post: async (url, payload = {}) => {
        try {
            // get the secret key and convert payload to string
            const secretKey = import.meta.env.VITE_API_KEY;
            const stringifiedPayload = api.stringifyPayload(payload);
            
            // sort the payload keys alphabetically
            const orderedPayload = {};
            const sortedKeys = Object.keys(stringifiedPayload).sort();
            sortedKeys.forEach(key => {
                orderedPayload[key] = stringifiedPayload[key];
            });

            // generate HMAC signature
            const payloadString = JSON.stringify(orderedPayload);
            const hmac = CryptoJS.HmacSHA256(payloadString, secretKey);
            const signature = hmac.toString(CryptoJS.enc.Hex);

            // make the POST request with the signature in the headers
            const response = await axios.post(url, orderedPayload, {
                headers: {
                    'X-Signature': signature,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
            throw error;
        }
    },
};