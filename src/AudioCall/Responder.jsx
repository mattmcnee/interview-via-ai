import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useAudioCall } from './AudioCallContext';

const Responder = () => {
    const { userCurrentMessage, setAiTranscript } = useAudioCall();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

  const handleClick = async (text, time) => {
    setLoading(true);
    setError(null);
    setMessage(''); // Reset message on button click

    console.log('text:', text);

    try {
      const topK = 5; // Adjust as needed

      const result = await axios.post(`${import.meta.env.VITE_API_URL}/getSimilarDocuments`, {
        topK,
        text
      });

      console.log(result.data); // Log the response to the console
      setMessage(result.data.message); // Set the retrieved message to state

        setAiTranscript(prevTranscript => [...prevTranscript, {text: result.data.message, time: time, role: "ai"}]);

    } catch (err) {
      setError('An error occurred while fetching similar documents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


useEffect(() => {
    if (userCurrentMessage !== '') {
        handleClick(userCurrentMessage.sentence, userCurrentMessage.time);
    }
}, [userCurrentMessage]);

  return (
    <div></div>
  );
};

export default Responder;
