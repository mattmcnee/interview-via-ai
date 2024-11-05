import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioCallContext = createContext();
export const useAudioCall = () => {
    return useContext(AudioCallContext);
};

export const AudioCallProvider = ({ setMeetingState, setSavedTranscript, ttsApiPath, children }) => {
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [combinedTranscript, setCombinedTranscript] = useState('');
    const transcriptRef = useRef(null);
    const isGeneratingResponseRef = useRef(false);

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
        isGeneratingResponseRef.current = true
        if (messageResponseRef.current) {
            return await messageResponseRef.current(message);
        }
    };

    const pushUserMessage = async () => {
        updateTranscript();

        if (isGeneratingResponseRef.current != true) {
            isGeneratingResponseRef.current = true
            const transcriptLength = transcriptRef.current.length;
            if (messageResponseRef.current) {
                const responseMessage = await messageResponseRef.current()
                callPlaySpeaker(responseMessage);

                isGeneratingResponseRef.current = false;
                if (transcriptRef.current.length > transcriptLength) {
                    pushUserMessage();
                }
            }
        }
    };

    // combine and sort the transcripts by time
    const updateTranscript = () => {
        const combinedTranscript = [...userTranscript, ...aiTranscript].sort((a, b) => a.time - b.time);
        setCombinedTranscript(combinedTranscript);
        setSavedTranscript(combinedTranscript);
        transcriptRef.current = combinedTranscript;
    }

    useEffect(() => {
        updateTranscript();
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
            timer,
            setMeetingState,
            ttsApiPath,
            transcriptRef,
            isGeneratingResponseRef
        }}>
            {children}
        </AudioCallContext.Provider>
    );
};


