import React, { createContext, useContext, useState, useEffect } from 'react';

const AudioCallContext = createContext();
export const useAudioCall = () => {
    return useContext(AudioCallContext);
};

export const AudioCallProvider = ({ children }) => {
    const [userTranscript, setUserTranscript] = useState('');
    const [previousMessageLength, setPreviousMessageLength] = useState(0); // State to track previous length
    const [userCurrentMessage, setUserCurrentMessage] = useState('');

    useEffect(() => {
        // Assuming userTranscript is a JSON string containing an array of message objects
        const messages = userTranscript || [];

        // Check if the current length of messages has increased
        if (messages.length > previousMessageLength) {
            const message = messages.pop()
            if (message.role === 'ai' && messages[previousMessageLength]?.role === 'user') {
                setUserCurrentMessage(messages[previousMessageLength]?.text)
            }
            setPreviousMessageLength(messages.length);
        }

        // Update previous message length
        
    }, [userTranscript, previousMessageLength]);

    

    return (
        <AudioCallContext.Provider value={{ userTranscript, setUserTranscript, userCurrentMessage }}>
            {children}
        </AudioCallContext.Provider>
    );
};

