import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useAudioCall } from './AudioCallContext';

const Responder = () => {

    const { messageResponseRef } = useAudioCall();

    useEffect(() => {
        messageResponseRef.current = async (message) => {
            const responseMessage = await handleClick(message.sentence, message.time);
            return responseMessage; // Return the response in this function
        };

        return () => {
            messageResponseRef.current = null; // Clean up on unmount
        };
    }, [messageResponseRef]);

    const handleClick = async (text, time) => {
        const preprompt = `You are a candidate in a job interview answering questions. 
        Use only the relevant details about yourself in the provided context to answer questions.
        If greeted or thanked, respond politely without requiring context; DO NOT USE "!"
        Apologise if no relevant content is available, say either that you "don't know" or "can't recall" and ask for other questions. 
        Be concise; DO NOT OFFER TO ASSIST OR HELP THE USER; do not break character; do not refer to "the context"; DO NOT USE "!"`;

        try {
            const topK = 5; // number of similar documents to retrieve

            const result = await axios.post(`${import.meta.env.VITE_API_URL}/getSimilarDocuments`, {
                topK,
                text,
                preprompt
            });

            const responseMessage = result.data.message;

            return responseMessage; // Return the response message
        } catch (e) {
            console.error(e);
            return null; // Return null in case of error
        } 
    };

    return (
        <div></div>
    );
};

export default Responder;
