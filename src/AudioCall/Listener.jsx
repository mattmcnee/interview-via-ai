import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAudioCall } from './AudioCallContext';

const Listener = () => {
    const { setUserTranscript, setUserCurrentMessage, combinedTranscript, pushUserMessage } = useAudioCall();

    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);
    const [responses, setResponses] = useState([]);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const TIMESLICE = 3000;
    const PAUSE_THRESHOLD = 1.4

    useEffect(() => {
        const setupMediaRecorder = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream, { timeslice: TIMESLICE }); // 1 second chunks
                
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };
                
                recorder.onstop = handleCompleteStopRecording;
                setMediaRecorder(recorder);
            } catch (err) {
                console.error("Error setting up media recorder:", err);
                setError("Failed to access microphone.");
            }
        };
    
        if (!mediaRecorder) {
            setupMediaRecorder();
        }
    
        return () => {
            if (mediaRecorder) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                mediaRecorder.stop();
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            }
        };
    }, []);
    
    const handleStartRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            audioChunksRef.current = [];
            mediaRecorder.start();
            setIsRecording(true);
            console.log("Recording started");
            intervalRef.current = setInterval(() => {
                mediaRecorder.stop();
                mediaRecorder.start();
            }, TIMESLICE);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            console.log("Recording stopped");
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            sendCurrentAudio();
        }
    };

    const handleCompleteStopRecording = async () => {
        if (audioChunksRef.current.length > 0) {            
            await sendCurrentAudio();
        } else {
            console.error("No audio chunks available.");
            setError("No audio was recorded. Please try again.");
        }
    };

    const sendCurrentAudio = async () => {
        if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);

            // console.log("Sent audio:", decodedAudio);

            await sendAudio(audioBlob, decodedAudio.sampleRate);
            audioChunksRef.current = []; 
        }
    };

    const sendAudio = async (audioBlob, sampleRate = 22050) => {
        const reader = new FileReader();
        const timestamp = new Date().toISOString(); // Unique timestamp for ordering
    
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
    
            try {
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudioBatch`, {
                    filename: 'recording.webm',
                    encoding: 'OPUS',
                    sampleRateHertz: sampleRate,
                    languageCode: 'en-US',
                    fileaudio: base64Audio,
                });
    
                const response = {
                    text: result?.data[0]?.text,
                    words: result?.data[0]?.words,
                    timestamp: timestamp,
                };
    
                addOrderedResponse(response);
    
                setError(null);
            } catch (err) {
                setError(err.message);
                setResponses([]); // Clear responses on error
            }
        };
    
        reader.readAsDataURL(audioBlob);
    };
    
    // Function to store responses in order and handle pauses

    const orderedResponses = useRef([]);
    const [wordsArray, setWordsArray] = useState([]);
    const [lastEmptyResponse, setLastEmptyResponse] = useState(0);

    const addOrderedResponse = (newResponse) => {
        // Insert new response in order by timestamp
        orderedResponses.current = [...orderedResponses.current, newResponse].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        const updatedResponses = orderedResponses.current;



        // Flatten words from all responses into a single array
        const allWordsWithPauses = [];

        updatedResponses.forEach((response) => {
            if (!response.words) {
                setLastEmptyResponse(new Date(response.timestamp).getTime() / 1000 + 0.5 * TIMESLICE/1000);
                return; // Skip if no words
            }

            // Convert response timestamp into seconds
            const responseTimestamp = new Date(response.timestamp).getTime() / 1000; // Convert to seconds

            response.words.forEach((word) => {
                // Create a new word object with updated start and end times
                const updatedWord = {
                    word: word.word,
                    start: parseFloat(word.start) + responseTimestamp,
                    end: parseFloat(word.end) + responseTimestamp,
                };
                allWordsWithPauses.push(updatedWord);
            });


        });

        setWordsArray(allWordsWithPauses);
    };

    const userSentences = useRef([]);

    const addSentenceIfUnique = (sentence, time) => {
        console.log("Time:", time);
        if (sentence && !userSentences.current.includes(sentence)) {
            userSentences.current.push(sentence);
            pushUserMessage({sentence, time: time + 1});
        }
    };

    useEffect(() => {
        let resultString = '';
        let transcript = [];
        let transcriptString = '';
        wordsArray.forEach((wordObj, index) => {
            const endTime = wordObj.end;
            const nextWordObj = wordsArray[index + 1];
    
            // Add the current word to the result string
            resultString += wordObj.word + ' ';
            transcriptString += wordObj.word + ' ';
    
            // If there's a next word, calculate the gap
            if (nextWordObj) {
                const gap = nextWordObj.start - endTime;
                // If the gap is more than 1.4 seconds, add a full stop
                if (gap > 1.4) {
                    // Add resultString to userSentences if not already there
                    addSentenceIfUnique(resultString.trim(), endTime);
                    transcript.push({text:transcriptString.trim(), time: endTime, role: "user"});

                    resultString = "";
                    transcriptString = "";
                }
            }
        });
    
        resultString = resultString.trim();
    
        // Check if the end of the last word is more than 1.4 seconds before the current time
        
        if (wordsArray.length > 0) {
            const lastWordEndTime = wordsArray[wordsArray.length - 1].end;
            if (lastEmptyResponse - lastWordEndTime > 1.4) {
                // Add resultString to userSentences if not already there
                addSentenceIfUnique(resultString, lastWordEndTime);
            }
            transcript.push({text:transcriptString.trim(), time: lastWordEndTime, role: "user"});
        }

        setUserTranscript(transcript);
    }, [wordsArray, lastEmptyResponse]);

    return (
        <div>
            <button onClick={handleStartRecording} disabled={isRecording}>
                Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!isRecording}>
                Stop Recording
            </button>

            <div>
                {combinedTranscript && combinedTranscript.map((segment, index) => (
                    <div key={index} className="text-segment">
                        <p><strong>{segment.role}:</strong> {segment.text}</p>
                    </div>
                ))}
            </div>

            {error && <div>Error: {error}</div>}
        </div>
    );
};

export default Listener;
