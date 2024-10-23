// src/OpenAIPage.js
import React, { useState } from 'react';
import axios from 'axios';

const OpenAIPage = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/textCompletionOpenAi`, { prompt });
            console.log(res);
            setResponse(res.data.choices[0].message.content);
        } catch (err) {
            console.error(err);
            setError('An error occurred while calling the OpenAI API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>OpenAI API Interaction</h1>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here"
                    rows="4"
                    cols="50"
                    required
                />
                <br />
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Send Prompt'}
                </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {response && (
                <div>
                    <h2>Response:</h2>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
};

export default OpenAIPage;
