import React, { createContext, useContext, useState, useEffect } from 'react';

const AudioCallContext = createContext();
export const useAudioCall = () => {
    return useContext(AudioCallContext);
};

export const AudioCallProvider = ({ children }) => {
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [combinedTranscript, setCombinedTranscript] = useState('');


    const [userCurrentMessage, setUserCurrentMessage] = useState('');


    const pushUserMessage = (message) => {
        console.log(`User message: ${message.text}`);
    }

    useEffect(() => {
        // Combine and sort the transcripts by time
        const combinedTranscript = [...userTranscript, ...aiTranscript].sort((a, b) => a.time - b.time);
        
        // Update the state with the combined and sorted transcript
        setCombinedTranscript(combinedTranscript);
    }, [userTranscript, aiTranscript]);
    


    return (
        <AudioCallContext.Provider value={{ 
            userTranscript, 
            setUserTranscript, 
            userCurrentMessage, 
            pushUserMessage, 
            setUserCurrentMessage, 
            aiTranscript, 
            setAiTranscript,
            combinedTranscript
        }}>
            {children}
        </AudioCallContext.Provider>
    );
};

