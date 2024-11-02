import React, { useState } from 'react';
import axios from 'axios';

const Entry = ({ setMeetingState }) => {
    const [externalIp, setExternalIp] = useState('');

    const fetchExternalIp = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/checkFlask`);
            setExternalIp(response.data.externalIp);
        } catch (error) {
            console.error("Error fetching external IP:", error);
            setExternalIp('Unable to fetch IP');
        }
    };

    return (
        <div>
            <h1>Audio Call</h1>
            <button onClick={() => setMeetingState("loading")}>Enter Meeting</button>
            <button onClick={fetchExternalIp}>Get External IP</button>
            {externalIp && <p>External IP: {externalIp}</p>}
        </div>
    );
};

export default Entry;


