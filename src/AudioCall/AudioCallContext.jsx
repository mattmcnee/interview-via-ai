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
        const responseMessage =  await callGenerateResponse(message);

        callPlaySpeaker(responseMessage);
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
            setUserCurrentMessage, 
            aiTranscript, 
            setAiTranscript,
            combinedTranscript,
            playSpeakerRef,
            messageResponseRef,
            pushUserMessage
        }}>
            {children}
        </AudioCallContext.Provider>
    );
};

