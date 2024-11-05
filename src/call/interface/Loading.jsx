import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Loading = ({ setMeetingState, ttsApiPath, setTtsApiPath }) => {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Initializing VM...');
    const [vmStatus, setVmStatus] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [apiHealthy, setApiHealthy] = useState(false);
    const TIMEOUT_DURATION = 60000; // 60 seconds timeout

    // check if Flask server is running
    const checkApiHealth = useCallback(async (apiPath) => {
        try {
            const response = await axios.get(`${apiPath}/health`);
            const isHealthy = response.data?.status === 'ACTIVE';
            setApiHealthy(isHealthy);
            return isHealthy;
        } catch (error) {
            // Only log errors that are not connection or network-related
            if (error && !error.message.includes("ERR_CONNECTION_REFUSED") && !error.message.includes("ERR_NETWORK")) {
                console.error('API check failed:', error);
            }
            setApiHealthy(false);
            return false;
        }
    }, []);


    const checkVMStatus = useCallback(async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/checkVM`);
            const { success, message, status, externalIp } = response.data;

            if (success) {
                setVmStatus(`${status}`);
                if (externalIp && externalIp !== "blank") {
                    const newApiPath = `http://${externalIp}:5000`;
                    setTtsApiPath(newApiPath);
                }
                return { status, apiPath: externalIp ? `http://${externalIp}:5000` : null };
            } else {
                setMessage(`Failed: ${message}`);
                return { status: null, apiPath: null };
            }
        } catch (error) {
            console.error('Error checking VM status:', error);
            setMessage(`Error: ${error.message}`);
            return { status: null, apiPath: null };
        }
    }, [setTtsApiPath]);

    const handleStartVM = useCallback(async () => {
        setLoading(true);
        setMessage('');
        setVmStatus('');
        setApiHealthy(false);
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/startVM`);
            const { success, message, status, externalIp } = response.data;

            if (success) {
                setMessage(`Success: ${message} (Status: ${status})`);
                if (externalIp && externalIp !== "blank") {
                    const newApiPath = `http://${externalIp}:5000`;
                    setTtsApiPath(newApiPath);
                }
                setCheckingStatus(true);
                setStartTime(Date.now());
            } else {
                setMessage(`Failed: ${message}`);
                setMeetingState('error');
            }
        } catch (error) {
            console.error('Error starting VM:', error);
            setMessage(`Error: ${error.message}`);
            setMeetingState('error');
        } finally {
            setLoading(false);
        }
    }, [setMeetingState, setTtsApiPath]);

    useEffect(() => {
        handleStartVM();
    }, [handleStartVM]);

    useEffect(() => {
        let intervalId;
    
        if (checkingStatus && startTime) {
            intervalId = setInterval(async () => {
                const currentTime = Date.now();
                const elapsedTime = currentTime - startTime;
    
                if (elapsedTime >= TIMEOUT_DURATION) {
                    clearInterval(intervalId);
                    setCheckingStatus(false);
                    setMessage('Timeout: Status check exceeded 40 seconds');
                    setMeetingState('error');
                    return;
                }
    
                // If VM is already running and we have an API path, skip VM status check
                if (vmStatus === 'RUNNING' && ttsApiPath != "") {
                    setMessage('Checking API health...');
                    const isApiHealthy = await checkApiHealth(ttsApiPath);
                    
                    if (isApiHealthy) {
                        clearInterval(intervalId);
                        setCheckingStatus(false);
                        setMessage('VM and API are ready');
                        setVmStatus('LIVE');
                    } else {
                        setMessage('Waiting for API to become available...');
                    }
                } else {
                    // Otherwise check VM status
                    await checkVMStatus();
                }
            }, 1000);
        }
    
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [checkingStatus, startTime, checkVMStatus, checkApiHealth, setMeetingState, vmStatus, ttsApiPath]);

    return (
        <div className="space-y-4">
            {message && <p>{message}</p>}
            {vmStatus && <p>{vmStatus}</p>}
            {apiHealthy && <p>API Status: Active</p>}
            {vmStatus === 'LIVE' && (
                <button onClick={() => setMeetingState('meeting')} className="btn btn-primary">Start Meeting</button>
            )}
        </div>
    );
};

export default Loading;