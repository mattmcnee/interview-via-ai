import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useAudioCall } from './AudioCallContext';

const Responder = () => {

    const { messageResponseRef, transcriptRef } = useAudioCall();

    useEffect(() => {
        messageResponseRef.current = async () => {
            const responseMessage = await getResponse();
            return responseMessage; // Return the response in this function
        };

        return () => {
            messageResponseRef.current = null; // Clean up on unmount
        };
    }, [messageResponseRef]);

    const normalizeText = text => text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    const getResponse = async () => {
        console.log(transcriptRef.current);


        // Retrieve the last 20 messages and map them to the desired format
        var messages = transcriptRef.current.slice(-20).map(message => ({
            role: message.role === "user" ? "user" : "assistant",
            content: message.text
        }));

        // Join consecutive messages from the same role
        const joinedMessages = [];
        for (let i = 0; i < messages.length; i++) {
            const currentMessage = messages[i];

            if (joinedMessages.length === 0 || joinedMessages[joinedMessages.length - 1].role !== currentMessage.role) {
                joinedMessages.push(currentMessage);
            } else {
                joinedMessages[joinedMessages.length - 1].content += `\n${currentMessage.content}`;
            }
        }

        // strip joined messages down to 6 most recent
        const recentMessages = joinedMessages.slice(-6);

        const preprompt = `You are a candidate in a job interview answering questions. 
        Potential relevant context is provided in the user's most recent question. DO NOT REPEAT THE CONTEXT IF IT IS NOT RELEVANT. 
        Use only the conversation history or relevant details about yourself in this context to answer questions. If greeted or thanked, respond politely without requiring context; DO NOT USE "!"
        If there is nothing relevant in the context or conversation history: apologise, say either that you "don't know" or "can't recall" and ask for clarification or other questions. 
        When explaining concepts, be concise and focus on what relevant experience you have.
        Be concise; DO NOT OFFER TO ASSIST OR HELP THE USER; do not break character; do not refer to "the context"; DO NOT USE "!"
        It is more important to correctly respond to the user than to incorporate the context.
        DO NOT EXCEED 70 words and offer to answer more questions ONLY if the user says nothing of content.`;

        recentMessages.unshift({
            role: "system",
            content: preprompt
        });

        console.log(recentMessages);

        try {
            const topK = 3; // number of similar documents to retrieve

            const result = await axios.post(`${import.meta.env.VITE_API_URL}/getSimilarDocuments`, {
                topK,
                text: "",
                preprompt,
                history: recentMessages
            });

            const responseMessage = result.data.message;

            console.log(result.data.context)

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
