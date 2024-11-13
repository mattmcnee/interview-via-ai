import React, { useState, useRef, useEffect } from 'react';
import { api } from '/src/utils/api';
import { splitIntoSentences, cleanMessage, getGreeting } from '/src/utils/textProcessing';
import chatIcon from '/src/assets/chat.svg';
import closeIcon from '/src/assets/close.svg';
import HexagonBox from '../components/HexagonBox';

const AIChat = ({ preprompt }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const transcriptRef = useRef([]);
    const messagesEndRef = useRef(null);
    const initialMessage = `${getGreeting()}, I'm Matt's AI counterpart.`;

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
        <div style={{padding: '50px'}}>
        <HexagonBox/>
        </div>
        
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
        }}>
            <div style={{ position: 'relative', maxWidth: '400px', pointerEvents: 'initial' }}>
                    <div style={{
                        margin: '0',
                        padding: '0',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                    }}>
                        {isChatOpen ? (
                        <>
                        <img
                            src={closeIcon}
                            alt="Close chat"
                            onClick={() => setIsChatOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '36px',
                                height: '36px',
                                cursor: 'pointer',
                                padding: '5px',
                            }}
                        />
                        <div style={{ height: '300px', maxHeight: '300px', overflowY: 'auto', padding: '20px 10px 0 10px', margin: '1rem 0 0 0' }}>
                            <div style={{ textAlign: 'left', margin: '0.5rem 0', marginRight:'4rem',}}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '12px',
                                    background: '#e0e0e0',
                                    color: '#333'
                                }}>
                                    {initialMessage}
                                </span>
                            </div>
                            {messages.map((msg, index) => (
                                <div key={index} style={{
                                    textAlign: msg.role === 'user' ? 'right' : 'left',
                                    margin: '1rem 0',
                                    marginRight: msg.role === 'user' ? '0' : '4rem',
                                    marginLeft: msg.role === 'user' ? '4rem' : '0',
                                }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        background: msg.role === 'user' ? '#0078ff' : '#e0e0e0',
                                        color: msg.role === 'user' ? '#fff' : '#333',
                                    }}>
                                        {msg.text}
                                    </span>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ textAlign: 'left', margin: '1rem 0' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        background: '#e0e0e0',
                                        color: '#333',
                                    }}>...</span>
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
                            }}
                        />
                    </>
                ) : (
                    <img
                        src={chatIcon}
                        alt="Open chat"
                        onClick={() => setIsChatOpen(true)}
                        style={{ cursor: 'pointer', width: '40px', height: '40px', margin: '10px' }}
                    />
                )}
                </div>
            </div>
        </div>
        </>
    );
};

export default AIChat;
