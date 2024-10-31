import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAudioCall } from './AudioCallContext';

const Listener = () => {
    const { userTranscript, setUserTranscript, pushUserMessage } = useAudioCall();

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
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            }
        };
    }, []);  

    const processedUpTo = useRef(new Date(0));
    const oldResponses = useRef([]);

    const trackedResponses = useRef([]);

    const addResponse = (response) => {
        const allResponses = [...trackedResponses.current, response];
        
        // Sort them by timestamp
        const orderedResponses = allResponses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
        let currentText = '';
        let currentTimestamp = null;
        let timeElapsed = 0;
        let mostRecentWord = 0;
    
        // Iterate over the ordered responses and accumulate text
        orderedResponses.forEach(response => {

            currentTimestamp = response.timestamp;
            timeElapsed += TIMESLICE/1000;

            if (!response.text.length > 0 && currentText.length > 0) {
                const wordGap = timeElapsed - mostRecentWord;
                if (wordGap > PAUSE_THRESHOLD) {
                    currentText += ` <gap ${wordGap}> `
                    
                    mostRecentWord = timeElapsed;
                }    
            } else {
                response.text.forEach(textObj => {
                    textObj.words.forEach((wordObj, index) => {
                        const wordGap = parseFloat(wordObj.start) + timeElapsed - mostRecentWord;
                        if (wordGap > PAUSE_THRESHOLD && currentText.length > 0) {
                            currentText += ` <gap ${wordGap}> ` + wordObj.word;
                        } else {
                            currentText += ' ' + wordObj.word;
                        }
                        mostRecentWord = timeElapsed + parseFloat(wordObj.end);
                    });
                });
            }
        });

        trackedResponses.current = allResponses;
    
        console.log("Current Text:", currentText);
    };
    
    
    useEffect(() => {
  
      // filter out old responses and sort new responses chronologically 
      const orderedResponses = responses
        .filter(response => new Date(response.timestamp) >= processedUpTo.current)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let combinedText = [];
        let currentText = '';
        let currentTimestamp = null;
        let mostRecentWord = 0;
        let timeElapsed = 0;
    
        orderedResponses.forEach(response => {

            currentTimestamp = response.timestamp;
            timeElapsed += TIMESLICE/1000;

            response.text.forEach(textObj => {

                textObj.words.forEach((wordObj, index) => {
                    if (parseFloat(wordObj.start) + timeElapsed > PAUSE_THRESHOLD + mostRecentWord) {
                        // Push the current segment to combinedText
                        if (currentText.length > 0) {
                            combinedText.push({
                                text: currentText,
                                username: "User", 
                                role: "user",
                                timestamp: currentTimestamp
                            });
                            currentText = '';
                            processedUpTo.current = response.timestamp; // update to the new segment's starting timestamp

                            combinedText.push({
                                text: "...",
                                username: "AI", 
                                role: "ai",
                                timestamp: combinedText[combinedText.length-1]?.timestamp
                            });
                        }
                    } else if (index !== 0 || currentText.length > 0) {
                        // Add a space between words unless it's the first word
                        currentText += ' ';
                    }
    
                    // Append the word to the current text segment
                    currentText += wordObj.word;
    
                    // Update wordGap to the negative end time of the current word
                    mostRecentWord = timeElapsed + parseFloat(wordObj.end);
                });
            });
        });

        timeElapsed += TIMESLICE/1000;
    
        // Push the last segment if it's non-empty
        if (currentText.length > 0) {
            combinedText.push({
                text: currentText,
                username: "User",
                role: "user",
                timestamp: currentTimestamp
            });
        }

        if (timeElapsed > mostRecentWord + PAUSE_THRESHOLD && mostRecentWord != 0 && combinedText[combinedText.length-1]?.role === "user") {
            combinedText.push({
                text: "...",
                username: "AI", 
                role: "ai",
                timestamp: combinedText[combinedText.length-1]?.timestamp
            });
        }
    
        // console.log("Combined Text Array:", combinedText);
        setUserTranscript(combinedText);
    }, [responses]);

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
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            const timestamp = new Date().toISOString();

            try {
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudioNewPath`, {
                    filename: 'recording.webm',
                    encoding: 'OPUS',
                    sampleRateHertz: sampleRate,
                    languageCode: 'en-US',
                    fileaudio: base64Audio,
                });

                addResponse({
                    text: result?.data,
                    timestamp: timestamp,
                })

                // setResponses((prevResponses) => [...prevResponses, {
                //     text: result?.data,
                //     timestamp: timestamp,
                // }]);

                // console.log("Response:", result.data);
                setError(null);
            } catch (err) {
                setError(err.message);
                setResponses([]);
            }
        };

        reader.readAsDataURL(audioBlob);
    };

    return (
        <div>
            <button onClick={handleStartRecording} disabled={isRecording}>
                Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!isRecording}>
                Stop Recording
            </button>

            <div>
                {userTranscript && userTranscript.map((segment, index) => (
                    <div key={index} className="text-segment">
                        <p><strong>{segment.username}:</strong> {segment.text}</p>
                    </div>
                ))}
            </div>

            {error && <div>Error: {error}</div>}
        </div>
    );
};

export default Listener;
