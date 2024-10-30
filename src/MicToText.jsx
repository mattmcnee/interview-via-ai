import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MicToText = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]); // Use a ref to store audio chunks
    const [sampleRate, setSampleRate] = useState(22050); // Default sample rate
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const setupMediaRecorder = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioContext = new AudioContext();
                setSampleRate(audioContext.sampleRate); // Get sample rate from audio context

                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data); // Push data directly to ref
                        console.log("Data chunk added:", event.data);
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
                mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Stop audio tracks on cleanup
            }
        };
    }, []); // Removed mediaRecorder dependency to avoid re-initializing

    const handleStartRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            audioChunksRef.current = []; // Reset audio chunks before recording
            mediaRecorder.start();
            setIsRecording(true);
            console.log("Recording started");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            console.log("Recording stopped");
        }
    };

    const handleCompleteStopRecording = async () => {
        console.log("Stop event triggered");
        if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            await sendAudio(audioBlob);
            audioChunksRef.current = []; // Reset after processing
        } else {
            console.error("No audio chunks available.");
            setError("No audio was recorded. Please try again.");
        }
    };

    const sendAudio = async (audioBlob) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1]; // Get the base64 string after the comma

            try {
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudioNewPath`, {
                    filename: 'recording.wav', // Set a default file name
                    encoding: 'LINEAR16', // Specify the encoding (change if necessary)
                    sampleRateHertz: sampleRate, // Use the dynamic sample rate
                    languageCode: 'en-US', // Specify the language code
                    fileaudio: base64Audio, // Include the base64 encoded audio in the request body
                });
                setResponse(result.data);
                setError(null); // Clear previous errors
            } catch (err) {
                setError(err.message); // Capture and set any errors
                setResponse(null); // Clear previous responses
            }
        };

        reader.readAsDataURL(audioBlob); // Read the audio blob as Data URL
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

            {response && <div>Response: {JSON.stringify(response)}</div>}
            {error && <div>Error: {error}</div>}
        </div>
    );
};

export default MicToText;
