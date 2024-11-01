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

    // a few little tricks to make the computer box say tech things better
    const processTextForTTS = (text) => {
        return text.split(' ').map(word => {
          // remove trailing punctuation
          const trimmedWord = word.replace(/[.,!?;]$/, '');
          const punctuation = word.slice(trimmedWord.length);
        
          // separate letters in fully capitalized words, allowing for an 's' at the end
          if (/^[A-Z]+s?$/.test(trimmedWord)) {
            const lastChar = trimmedWord.charAt(trimmedWord.length - 1) === 's' ? 's' : '';
            const baseWord = lastChar ? trimmedWord.slice(0, -1) : trimmedWord;
            return baseWord.split('').join(' ') + (lastChar ? `'` + lastChar : '') + punctuation;
          }
        
          // replace occurences of '-' and '.' within words
          return trimmedWord.replace(/(?<=\w)[-.]+(?=\w)/g, ' ') + punctuation;
        }).join(' ').replace(/\bjs\b/g, 'J S'); // make it say "js" properly
    };

    const processTextForTranscript = (text, time) => {
        return text.split(/(?<=[.!?])\s+(?=[A-Z])/g)
            .filter(sentence => sentence.trim() !== '')
            .map((sentence, index) => ({
                text: sentence.replace(/\./g, '').trim(),
                time: time + 0.1 * index,
                role: "ai"
            }));
    };
    

    const pushUserMessage = async (message) => {
        const responseMessage =  await callGenerateResponse(message);

        const transcriptResponses = processTextForTranscript(responseMessage, message.time)

        setAiTranscript(prevTranscript => [...prevTranscript, ...transcriptResponses]);

        callPlaySpeaker(processTextForTTS(responseMessage));
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

