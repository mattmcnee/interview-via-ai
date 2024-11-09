import React, { useState } from 'react';
import axios from 'axios';

const SpeechToText = () => {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [audioFile, setAudioFile] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAudioFile(file);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!audioFile) return;

        // Read the audio file and convert it to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1]; // Get the base64 string after the comma

            try {
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudioNewPath`, {
                    filename: audioFile.name, // Include the file name
                    encoding: 'LINEAR16', // Specify the encoding (change if necessary)
                    sampleRateHertz: 22050, // Specify the sample rate
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

        reader.readAsDataURL(audioFile); // Read the audio file as Data URL
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

