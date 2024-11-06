import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LoadingBar from '/src/components/LoadingBar';
import HexagonButton from '/src/components/HexagonButton';

const Loading = ({ setMeetingState, ttsApiPath, setTtsApiPath }) => {
    const [message, setMessage] = useState("Warming up the voice box...");
    const [vmStatus, setVmStatus] = useState('');

    const pushVmState = useCallback((newStatus) => {
        setVmStatus(currentStatus => {
            // If current status is ACTIVE, ignore all further updates
            if (currentStatus === 'ACTIVE') {
                return currentStatus;
            }
    
            // Set friendly messages based on state
            switch (newStatus) {
                case 'INITIALISING':
                    setMessage("Warming up the voice box...");
                    break;
                case 'STARTING':
                    setMessage("Getting the brain ready...");
                    break;
                case 'RUNNING':
                    setMessage("Almost there, tuning the voice...");
                    break;
                case 'ERROR':
                    setMessage("Oops, something went wrong. Please try again later.");
                    break;
            }
    
            return newStatus;
        });
    }, []);

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

        pushVmState('INITIALISING');
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/startVM`);
            const { success, message, status, externalIp } = response.data;

            if (status === 'RUNNING') {
                pushVmState(status);
                const newApiPath = `http://${externalIp}:5000`;
                setTtsApiPath(newApiPath);
                const flaskStatus = await awaitFlaskStatus(newApiPath, 30000);
                pushVmState(flaskStatus.status);
            } else {
                pushVmState("STARTING");
                const apiStatus = await awaitVMStatus('RUNNING', 30000);
                pushVmState(apiStatus.status);

                const newApiPath = `http://${apiStatus.externalIp}:5000`;
                setTtsApiPath(newApiPath);

                const flaskStatus = await awaitFlaskStatus(newApiPath, 30000);
                pushVmState(flaskStatus.status);
            }
        } catch (error) {
            console.error('Error starting VM:', error);
            pushVmState('ERROR');
        }
    }, [setMeetingState, setTtsApiPath, vmStatus, pushVmState]);

    useEffect(() => {
        handleStartVM();
    }, [handleStartVM]);

    return (
        <div className="" style={{display:'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '860px', margin: ' 0 auto', height: '100%', padding: '50px 30px'}}>
            {/* <HexagonButton fill={false} action={() => setMeetingState('entry')} text="Back" size={60} textWidth={40} backgroundColor="#ccc" color="#000" /> */}
            <div style={{display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center'}}>
                <p style={{margin:'4px 0'}}>This is a proof of concept and is not quite realtime. Expect responses to take 1-3 seconds.</p>
                <p style={{margin:'4px 0'}}>Interruptions are currently not supported. Wait until the model has finished speaking before asking your next question.</p>
                <p style={{margin:'4px 0'}}>The model retains knowledge of your last three questions. The entire transcript is available after concluding the interview.</p>
            </div>

            <LoadingBar message={message} isLoading={vmStatus !== 'ACTIVE'} action={() => setMeetingState('meeting')}/>
        </div>
    );
};

export default Loading;