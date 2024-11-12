import React, { useState, useRef, useEffect } from 'react';
import { api } from '/src/utils/api';

const AIChat = ({ preprompt }) => {
    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Good morning";
        if (hours < 17) return "Good afternoon";
        return "Good evening";
    };
    const initialMessage = `${getGreeting()}, I'm Matt's AI counterpart.`;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(false);
    const transcriptRef = useRef([]);
    const messagesEndRef = useRef(null); // Reference to the bottom of the chat container

    const cleanMessage = (text) => {
        return text.endsWith('.') ? text.slice(0, -1) : text;
    };

    const splitIntoSentences = (paragraph) => {
        if (!paragraph) return [];

        const abbreviations = ['dr.', 'mr.', 'mrs.', 'ms.', 'prof.', 'sr.', 'jr.', 'etc.', 'inc.', 'ltd.', 'co.'];
        const abbrRegex = new RegExp(`\\b(${abbreviations.join('|')})\\s+`, 'gi');

        const withProtectedAbbr = paragraph.replace(abbrRegex, (match) => match.replace('.', '__ABBR__'));
        const withProtectedFullstops = withProtectedAbbr.replace(/(?<=\w)\.(?=\w)/g, '__FULLSTOP__');
        
        const sentenceRegex = /[^.!?]+[.!?]+/g;
        const matches = withProtectedFullstops.match(sentenceRegex) || [];

        const sentences = matches.map(sentence => 
            sentence.trim().replace(/\./g, '').replace(/__FULLSTOP__/g, '.').replace(/__ABBR__/g, '.')
        );

        const lastIndex = matches.join('').length;
        const remaining = withProtectedFullstops.slice(lastIndex).trim();
        
        if (remaining) {
            sentences.push(
                remaining.replace(/__FULLSTOP__/g, '.').replace(/__ABBR__/g, '.')
            );
        }

        return sentences.map(sentence => sentence.replace(/"/g, '').trim());
    };

    const getResponse = async () => {
        setLoading(true); // Start loading

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
    
            // Adding a delay for each sentence after the first
            sentences.forEach((sentence, index) => {
                setTimeout(() => {
                    const newMessage = { role: 'assistant', text: sentence };
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                    transcriptRef.current.push(newMessage);
                    if (index === sentences.length - 1) setLoading(false); // Stop loading after last sentence
                }, index * 800); // Delay each message by 0.8s after the previous
            });
        } catch (e) {
            console.error('Error fetching response:', e);
            setLoading(false); // Stop loading if error occurs
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

    // Scroll to the bottom whenever the messages or loading state changes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem 0 0 0', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div style={{ height: '300px', maxHeight: '300px', overflowY: 'auto', padding: '0 10px'}}>
                <div style={{ textAlign: 'left', margin: '0.5rem 0' }}>
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
                    <div key={index} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '1rem 0', marginRight: msg.role === 'user' ? '0' : '4rem', marginLeft: msg.role === 'user' ? '4rem' : '0', }}>
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
                {/* Invisible div at the bottom to trigger scroll */}
                <div ref={messagesEndRef} />
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{ width: '100%', margin: '0', padding: '1rem', borderRadius: '0', border: 'none', outline: 'none', backgroundColor: 'transparent', borderTop: '1px solid #ddd' }}
            />
        </div>
    );
};

export default AIChat;
