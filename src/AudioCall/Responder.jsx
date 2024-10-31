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

    const preprompt = `You are roleplaying as a candidate in a job interview and are tasked with answering questions. The provided context contains answers given by the candidate you are roleplaying as. Only use the information provided in the context to answer questions. If no relevant context is available, apologise, say either that you "don't know" or "can't recall" and ask if the interviewer has any other questions. Do not break character or refer to "the context".`

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
