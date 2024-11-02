import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Loading = ({ setMeetingState, ttsApiPath, setTtsApiPath }) => {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Initializing VM...');
    const [vmStatus, setVmStatus] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [startTime, setStartTime] = useState(null);

    const checkVMStatus = useCallback(async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/checkVM`);
            const { success, message, status, externalIp } = response.data; // Destructure externalIp

            if (success) {
                setVmStatus(`VM Status: ${status}`);
                if (externalIp && externalIp !== "blank") { // Check externalIp
                    setTtsApiPath("http://"+externalIp+":5000");
                    console.log('TTS API Path:', externalIp); // Log the externalIp
                }
                if (status === 'RUNNING') {
                    setCheckingStatus(false);
                    setMeetingState('meeting');
                    setMessage('VM is now running');
                }
                return status;
            } else {
                setMessage(`Failed: ${message}`);
                return null;
            }
        } catch (error) {
            console.error('Error checking VM status:', error);
            setMessage(`Error: ${error.message}`);
            return null;
        }
    }, [setMeetingState]);

    const handleStartVM = useCallback(async () => {
        setLoading(true);
        setMessage('');
        setVmStatus('');
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/startVM`);
            const { success, message, status, externalIp } = response.data;

            if (success) {
                setMessage(`Success: ${message} (Status: ${status})`);
                if (externalIp && externalIp !== "blank") { // Check externalIp
                    setTtsApiPath("http://"+externalIp+":5000");
                    console.log('TTS API Path:', externalIp); // Log the externalIp
                }
                if (status === 'RUNNING') {
                    setMeetingState('meeting');
                } else {
                    setCheckingStatus(true);
                    setStartTime(Date.now());
                }
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
    }, [setMeetingState]);

    useEffect(() => {
        handleStartVM();
    }, [handleStartVM]);

    useEffect(() => {
        let intervalId;

        if (checkingStatus && startTime) {
            intervalId = setInterval(async () => {
                const currentTime = Date.now();
                const elapsedTime = currentTime - startTime;

                if (elapsedTime >= 30000) {
                    clearInterval(intervalId);
                    setCheckingStatus(false);
                    setMessage('Timeout: VM status check exceeded 30 seconds');
                    setMeetingState('error');
                    return;
                }

                const status = await checkVMStatus();
                if (status === 'RUNNING') {
                    clearInterval(intervalId);
                }
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [checkingStatus, startTime, checkVMStatus, setMeetingState]);

    return (
        <div className="space-y-4">
            {message && <p>{message}</p>}
            {vmStatus && <p>{vmStatus}</p>}
        </div>
    );
};

export default Loading;
