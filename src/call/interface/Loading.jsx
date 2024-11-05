import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Loading = ({ setMeetingState, ttsApiPath, setTtsApiPath }) => {
    const [message, setMessage] = useState('Initializing VM...');
    const [vmStatus, setVmStatus] = useState('');

    const awaitVMStatus = async (targetStatus, timeout = 30000) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/awaitVMStatus`, {
                params: {
                    target: targetStatus,
                    timeout
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const awaitFlaskStatus = async (apiPath, timeout = 30000) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/awaitFlaskStatus`, {
                params: {
                    apiPath,
                    timeout
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error checking Flask API status:", error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const handleStartVM = useCallback(async () => {
        if (vmStatus === 'ACTIVE') {
            return;
        }

        setVmStatus('INITIALISING');
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/startVM`);
            const { success, message, status, externalIp } = response.data;

            if (status === 'RUNNING') {
                setVmStatus(status);
                const newApiPath = `http://${externalIp}:5000`;
                setTtsApiPath(newApiPath);
                const flaskStatus = await awaitFlaskStatus(newApiPath, 30000);
                setVmStatus(flaskStatus.status);
            } else {
                setVmStatus("STARTING");
                const apiStatus = await awaitVMStatus('RUNNING', 30000);
                setVmStatus(apiStatus.status);

                const newApiPath = `http://${apiStatus.externalIp}:5000`;
                setTtsApiPath(newApiPath);

                const flaskStatus = await awaitFlaskStatus(newApiPath, 30000);
                setVmStatus(flaskStatus.status);
            }
        } catch (error) {
            console.error('Error starting VM:', error);
            setVmStatus('ERROR');
        }
    }, [setMeetingState, setTtsApiPath]);

    useEffect(() => {
        handleStartVM();
    }, [handleStartVM]);

    useEffect(() => {
        if (vmStatus === 'ERROR') {
            setMessage('Error starting VM. Please try again later.');
        }
    }, [vmStatus]);

    return (
        <div className="">
            <p>This is a proof of concept and is not quite realtime. Expect responses to take 1-3 seconds.</p>
            <p>Interruptions are currently not supported. Wait until the model has finished speaking before asking your next question.</p>
            <p>The model retains knowledge of your last three questions. The entire transcript is available after concluding the interview.</p>

            {message && <p>{message}</p>}
            {vmStatus && <p>{vmStatus}</p>}
            {vmStatus === 'ACTIVE' && (
                <button onClick={() => setMeetingState('meeting')} className="btn btn-primary">Start Meeting</button>
            )}
        </div>
    );
};

export default Loading;