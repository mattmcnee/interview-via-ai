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

    const preprompt = `You are a candidate in a job interview answering questions. 
    Use only the relevant details about yourself in the provided context to answer questions.
    If greeted or thanked, respond appropriately without requiring context; DO NOT USE "!"; if your response is only a few words, perhaps thank the interviewer for their time.
    Apologise if no relevant content is available, say either that you "don't know" or "can't recall" and ask for other questions. 
    Be concise; DO NOT OFFER TO ASSIST OR HELP THE USER; do not break character; do not refer to "the context"`;

    console.log('text:', text);

    try {
      const topK = 5; // Adjust as needed

      const result = await axios.post(`${import.meta.env.VITE_API_URL}/getSimilarDocuments`, {
        topK,
        text,
        preprompt
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
