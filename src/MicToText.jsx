import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MicToText = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const setupMediaRecorder = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
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
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); 

    const handleStartRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            audioChunksRef.current = [];
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

            // Decode the audio to dynamically get the sample rate
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
            console.log("Dynamically calculated sample rate:", decodedAudio.sampleRate);

            await sendAudio(audioBlob, decodedAudio.sampleRate);
            downloadAudio(audioBlob); // Trigger download
            audioChunksRef.current = [];
        } else {
            console.error("No audio chunks available.");
            setError("No audio was recorded. Please try again.");
        }
    };

    const downloadAudio = (audioBlob) => {
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Free up the memory
    };

    const sendAudio = async (audioBlob, sampleRate = 22050) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            try {
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudioNewPath`, {
                    filename: 'recording.webm',
                    encoding: 'OPUS',
                    sampleRateHertz: sampleRate,
                    languageCode: 'en-US',
                    fileaudio: base64Audio,
                });
                setResponse(result.data);
                setError(null);
            } catch (err) {
                setError(err.message);
                setResponse(null);
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

            {response && <div>Response: {JSON.stringify(response)}</div>}
            {error && <div>Error: {error}</div>}
        </div>
    );
};

export default MicToText;
