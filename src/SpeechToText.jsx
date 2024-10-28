import React, { useState } from 'react';
import axios from 'axios';

const SpeechToText = () => {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [audioFile, setAudioFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'audio/wav') {
            setAudioFile(file);
        } else {
            setError('Please upload a valid .wav file.');
        }
    };

    const convertToMono = async (file) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Create a new audio buffer with a single channel (mono)
        const monoBuffer = audioContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
        const channelData = monoBuffer.getChannelData(0);

        // Mix down the stereo channels (if any) to mono
        for (let i = 0; i < audioBuffer.length; i++) {
            channelData[i] = (audioBuffer.getChannelData(0)[i] + (audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1)[i] : 0)) / audioBuffer.numberOfChannels;
        }

        // Convert the mono audio buffer back to a WAV file
        const wavData = await audioBufferToWav(monoBuffer);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        return blob;
    };

    const audioBufferToWav = (buffer) => {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels * 2 + 44; // 16-bit audio
        const bufferArray = new ArrayBuffer(length);
        const view = new DataView(bufferArray);

        // Write WAV header
        writeWavHeader(view, buffer, numberOfChannels);

        // Write PCM data
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                const sample = Math.max(-1, Math.min(1, channelData[i])); // Clamp to [-1, 1]
                view.setInt16(44 + i * 2 + channel * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true); // Little-endian
            }
        }

        return bufferArray;
    };

    const writeWavHeader = (view, buffer, numberOfChannels) => {
        const sampleRate = buffer.sampleRate;
        const byteRate = sampleRate * numberOfChannels * 2; // 16-bit audio

        // RIFF identifier
        view.setUint32(0, 1380533830, true); // "RIFF" in ASCII
        // file length
        view.setUint32(4, 36 + buffer.length * 2, true);
        // RIFF type
        view.setUint32(8, 1463899717, true); // "WAVE"
        // format chunk identifier
        view.setUint32(12, 1718449184, true); // "fmt "
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (PCM)
        view.setUint16(20, 1, true);
        // channel count
        view.setUint16(22, numberOfChannels, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, byteRate, true);
        // block align (channel count * bytes per sample)
        view.setUint16(32, numberOfChannels * 2, true);
        // bits per sample
        view.setUint16(34, 16, true);
        // data chunk identifier
        view.setUint32(36, 1684108385, true); // "data"
        // data chunk length
        view.setUint32(40, buffer.length * 2, true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!audioFile) {
            setError('No audio file selected.');
            return;
        }

        try {
            // Convert audio to mono
            const monoAudioBlob = await convertToMono(audioFile);

            // Convert the mono audio file to base64
            const reader = new FileReader();
            reader.readAsDataURL(monoAudioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1]; // Remove the data URL prefix

                // Replace 'YOUR_CLOUD_FUNCTION_URL' with your actual Cloud Function URL
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudio`, {
                    audio: base64Audio, // Include the base64 encoded audio in the request body
                });
                setResponse(result.data);
            };

            reader.onerror = (error) => {
                setError('Error reading the file: ' + error.message);
            };
        } catch (err) {
            setError(err.response ? err.response.data : 'An error occurred');
        }
    };

    return (
        <div>
            <h1>Speech-to-Text Example</h1>
            <form onSubmit={handleSubmit}>
                <input 
                    type="file" 
                    accept=".wav" 
                    onChange={handleFileChange} 
                    required 
                />
                <button type="submit">Send Audio for Transcription</button>
            </form>

            {response && <div>Response: {JSON.stringify(response)}</div>}
            {error && <div>Error: {error}</div>}
        </div>
    );
};

export default SpeechToText;
