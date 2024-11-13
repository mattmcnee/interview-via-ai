import React, { useState } from 'react';
import chatIcon from '/src/assets/chat.svg';
import TextAIChat from '/src/tests/chatbox/TextAIChat';
import HexagonBox from '/src/components/HexagonBox';
import HexagonButton from '/src/components/HexagonButton';

const AIChatOverlay = () => {
    const [messages, setMessages] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const preprompt = `You are a candidate in a job interview answering questions. 
    Potential relevant context is provided in the user's most recent question. DO NOT claim to have experience not listed in this. DO NOT include the context UNLESS it addresses the user's message. 
    Use ONLY the conversation history or relevant details about yourself in this context to answer questions. IF greeted or thanked, respond politely without requiring context; DO NOT USE "!"
    IF there is nothing relevant in the context or conversation history: apologise, say either that you "don't know" or "can't recall" and ask for clarification or other questions. 
    When explaining concepts, be concise and FOCUS on what relevant experience you have. ENSURE your answers are LOGICALLY CONSISTENT and GRAMATICALLY CORRECT.
    Be concise; speak naturally; do not break character; do not refer to "the context"; DO NOT USE "!"; DO NOT SAY or include "feel free to ask"
    It is MORE IMPORTANT to CORRECTLY RESPOND to the user than to incorporate the context; DO NOT SAY "How can I assist you?"; DO NOT EXCEED 50 words.`;

    return (
        <>        
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '30px',
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'hidden',
        }}>
            <div style={{ position: 'relative', maxWidth: '400px', pointerEvents: 'initial' }}>
            {isChatOpen ? (

                <HexagonBox height={isChatOpen ? '400px' : '4px'} width={isChatOpen ? '300px' : '80px'} borderRadius={12} backgroundColor="#f9f9f9">
                    
                        <TextAIChat preprompt={preprompt} messages={messages} setMessages={setMessages} setIsChatOpen={setIsChatOpen}/>
                        </HexagonBox>
                ) : (
                    <HexagonButton fill={true} contentWidth={42} backgroundColor="#fcfcfc" action={() => setIsChatOpen(true)} content={
                        <img
                            src={chatIcon}
                            alt="Open chat"
                            style={{ cursor: 'pointer', width: '40px', height: '40px', margin: '10px 0' }}
                        />
                    }/>
                )}
            </div>
        </div>
        </>
    );
};

export default AIChatOverlay;
