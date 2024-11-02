import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioCallContext = createContext();
export const useAudioCall = () => {
    return useContext(AudioCallContext);
};

export const AudioCallProvider = ({ children }) => {
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [combinedTranscript, setCombinedTranscript] = useState('');

    const [userCurrentMessage, setUserCurrentMessage] = useState('');
    const [timer, setTimer] = useState(150);

    const playSpeakerRef = useRef(null);
    const messageResponseRef = useRef(null);

    const callPlaySpeaker = (transcript) => {
        if (playSpeakerRef.current) {
            playSpeakerRef.current(transcript);
        }
    };

    const callGenerateResponse = async (message) => {
        if (messageResponseRef.current) {
            return await messageResponseRef.current(message);
        }
    };

    const pushUserMessage = async (message) => {
        const responseMessage = await callGenerateResponse(message);
        callPlaySpeaker(responseMessage);
    };

    useEffect(() => {
        // Combine and sort the transcripts by time
        const combinedTranscript = [...userTranscript, ...aiTranscript].sort((a, b) => a.time - b.time);
        setCombinedTranscript(combinedTranscript);
    }, [userTranscript, aiTranscript]);

    useEffect(() => {
        // Countdown timer
        const countdown = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Clear interval when component unmounts
        return () => clearInterval(countdown);
    }, []);
    
    return (
        <AudioCallContext.Provider value={{ 
            userTranscript, 
            setUserTranscript, 
            userCurrentMessage, 
            setUserCurrentMessage, 
            aiTranscript, 
            setAiTranscript,
            combinedTranscript,
            playSpeakerRef,
            messageResponseRef,
            pushUserMessage,
            timer
        }}>
            {children}
        </AudioCallContext.Provider>
    );
};


