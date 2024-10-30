// src/components/AudioStreamer.jsx
import React, { useState } from 'react';
import { db } from '/src/firebase'; // Ensure the import path is correct
import { collection, doc, onSnapshot } from 'firebase/firestore';

const AudioStreamer = () => {
  const [sessionId, setSessionId] = useState('');
  const [transcriptions, setTranscriptions] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const startStream = async () => {
    if (!sessionId) {
      alert('Please enter a session ID.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/startStream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsStreaming(true);
        console.log(data.message);
        // Set up a listener for Firestore to fetch transcriptions
        listenForTranscriptions();
      } else {
        console.error('Error starting stream:', data);
      }
    } catch (error) {
      console.error('Error during fetch:', error);
    }
  };

  const listenForTranscriptions = () => {
    // Listen for transcriptions in Firestore
    const transcriptionRef = collection(doc(db, 'activeSessions', sessionId), 'transcriptions');

    // Subscribe to updates
    onSnapshot(transcriptionRef, (snapshot) => {
      const newTranscriptions = snapshot.docs.map(doc => doc.data());
      setTranscriptions(newTranscriptions);
    });
  };

  const handleInputChange = (event) => {
    setSessionId(event.target.value);
  };

  return (
    <div>
      <h1>Audio Streamer</h1>
      <input
        type="text"
        placeholder="Enter Session ID"
        value={sessionId}
        onChange={handleInputChange}
      />
      <button onClick={startStream} disabled={isStreaming}>
        {isStreaming ? 'Streaming...' : 'Start Stream'}
      </button>

      <h2>Transcriptions:</h2>
      <ul>
        {transcriptions.map((transcription, index) => (
          <li key={index}>{transcription.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default AudioStreamer;
