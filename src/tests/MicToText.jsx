import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MicToText = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);
    const [responses, setResponses] = useState([]);
    const [combinedResponse, setCombinedResponse] = useState(''); // New state variable
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const TIMESLICE = 3000;
    const PAUSE_THRESHOLD = 1.2

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

    useEffect(() => {
        // Sort responses by timestamp
        const orderedResponses = responses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let combinedText = [];
        let currentText = ''; // temporary string to hold the current segment
        let currentTimestamp = null; // timestamp of the first response for the current segment
        let mostRecentWord = 0;
        let timeElapsed = 0;
    
        // Process each response in order
        orderedResponses.forEach(response => {

            currentTimestamp = response.timestamp;
            timeElapsed += TIMESLICE/1000;


            response.text.forEach(textObj => {

                textObj.words.forEach((wordObj, index) => {
                    // Check if we need to start a new segment
                    if (parseFloat(wordObj.start) + timeElapsed > PAUSE_THRESHOLD + mostRecentWord) {
                        // Push the current segment to combinedText
                        if (currentText.length > 0) {
                            combinedText.push({
                                text: currentText,
                                username: "User", 
                                timestamp: currentTimestamp
                            });
                            currentText = ''; // reset for a new segment
                            currentTimestamp = response.timestamp; // update to the new segment's starting timestamp
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
    
        // Push the last segment if it's non-empty
        if (currentText.length > 0) {
            combinedText.push({
                text: currentText,
                username: "User",
                timestamp: currentTimestamp
            });
        }
    
        console.log("Combined Text Array:", combinedText);
        setCombinedResponse(combinedText);
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

            console.log("Sent audio:", decodedAudio);

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

                setResponses((prevResponses) => [...prevResponses, {
                    text: result?.data,
                    timestamp: timestamp,
                }]);

                console.log("Response:", result.data);
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
            <h1>Mic to Text Example</h1>
            <button onClick={handleStartRecording} disabled={isRecording}>
                Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!isRecording}>
                Stop Recording
            </button>

            <div>
                {combinedResponse && combinedResponse.map((segment, index) => (
                    <div key={index} className="text-segment">
                        <p><strong>{segment.username}:</strong> {segment.text}</p>
                    </div>
                ))}
            </div>

            {error && <div>Error: {error}</div>}
        </div>
    );
};

export default MicToText;
