import React, { useState, useRef, useEffect } from 'react';
import { api } from '/src/utils/api';
import { splitIntoSentences, cleanMessage, getGreeting } from '/src/utils/textProcessing';
import chatIcon from '/src/assets/chat.svg';
import closeIcon from '/src/assets/close.svg';
import HexagonBox from '/src/components/HexagonBox';

const AIChat = ({ preprompt, messages, setMessages, setIsChatOpen }) => {
    const [input, setInput] = useState('');
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(false);
    const transcriptRef = useRef([]);
    const messagesEndRef = useRef(null);
    const initialMessage = `${getGreeting()}, I'm Matt's AI counterpart`;

    const getResponse = async () => {
        setLoading(true);

        const recentMessages = transcriptRef.current.slice(-20).map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.text,
        }));

        const joinedMessages = [];
        for (let i = 0; i < recentMessages.length; i++) {
            const currentMessage = recentMessages[i];
            if (joinedMessages.length === 0 || joinedMessages[joinedMessages.length - 1].role !== currentMessage.role) {
                joinedMessages.push(currentMessage);
            } else {
                joinedMessages[joinedMessages.length - 1].content += `\n${currentMessage.content}`;
            }
        }

        const trimmedMessages = joinedMessages.slice(-6);
        trimmedMessages.unshift({ role: 'system', content: preprompt });

        try {
            const topK = 3;
            if (trimmedMessages[trimmedMessages.length - 1].role === 'assistant') return;

            const result = await api.post(`${import.meta.env.VITE_API_URL}/getSimilarDocuments`, {
                topK,
                text: trimmedMessages[trimmedMessages.length - 1].content,
                preprompt,
                history: trimmedMessages,
            });

            let responseMessage = result.data.message;
            responseMessage = cleanMessage(responseMessage);

            const relevantReferences = result.data.context.matches
                .filter(match => match.score > 0.25)
                .map(match => ({ title: match.metadata.title, answer: match.metadata.answer, score: match.score }));

            setReferences(relevantReferences);

            const sentences = splitIntoSentences(responseMessage);

            sentences.forEach((sentence, index) => {
                setTimeout(() => {
                    const newMessage = { role: 'assistant', text: sentence };
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                    transcriptRef.current.push(newMessage);
                    if (index === sentences.length - 1) setLoading(false);
                }, index * 800);
            });
        } catch (e) {
            console.error('Error fetching response:', e);
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (input.trim() === '') return;

        const userMessage = { role: 'user', text: input.trim() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        transcriptRef.current.push(userMessage);
        setInput('');
        getResponse();
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    return (

        <>
        <img
            src={closeIcon}
            alt="Close chat"
            onClick={() => setIsChatOpen(false)}
            style={{
                position: 'absolute',
                top: '10px',
                right: '16px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                padding: '5px',
                zIndex: '3'
            }}
        />
        <div style={{ position: "absolute", top: "0", right: "0", height:"30px", width: "60px", borderLeft: '1px solid #ccc', border: "none"}}></div>
        <div style={{ height: "50px", width: "60px", borderBottom: '1px solid #ccc', borderLeft: '1px solid #ccc', justifySelf: 'flex-end', borderBottomLeftRadius: '12px', border: "none"}}></div>
        <div style={{ height: '300px', maxHeight: '300px', overflowY: 'auto', padding: '20px 10px 0 10px', margin: '0' }}>
            <div style={{ display: "flex", alignItems: 'flex-start', margin: '0.5rem 0', marginRight: '80px',}}>
                <HexagonBox borderRadius={6} height="4px" borderColor="transparent" backgroundColor="#DCDCDC" flexDirection="row">
                    <span style={{
                        display: 'inline-block',
                        padding: '0 14px',
                        borderRadius: '12px',
                        color: '#333',
                        width: 'fit-content',
                        
                    }}>{initialMessage}</span>
                </HexagonBox>
            </div>
            {messages.map((msg, index) => (
                <div key={index} style={{
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    margin: '1rem 0',
                    display: "flex", 
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginRight: msg.role !== 'user' ? '80px' : '0',
                    marginLeft: msg.role === 'user' ? '80px' : '0',
                }}>
                <HexagonBox  borderRadius={6} height="4px" borderColor="transparent" backgroundColor={msg.role === 'user' ? '#4662b8' : '#DCDCDC'} flexDirection="row">
                    <span style={{
                        display: 'inline-block',
                        padding: '0 14px',
                        borderRadius: '12px',
                        color: msg.role === 'user' ? '#fdfdfd' : '#111',
                        width: 'fit-content',
                    }}>{msg.text}</span>
                </HexagonBox>
                </div>
                
            ))}
            {loading && (
                <div style={{ textAlign: 'left', margin: '1rem 0' }}>
                <HexagonBox  borderRadius={6} height="4px" borderColor="transparent" backgroundColor="#DCDCDC" flexDirection="row">
                    <span style={{
                        display: 'inline-block',
                        padding: '0 14px',
                        borderRadius: '12px',
                        color: '#333',
                        width: 'fit-content',
                    }}>...</span>
                </HexagonBox>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{
                width: '100%',
                padding: '1rem',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                borderTop: '1px solid #ddd',
                marginBottom: '10px',
            }}
        />
    </>
    );
};

export default AIChat;
