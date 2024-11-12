import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss';
import AudioCallPage from './call/AudioCallPage';
import GoogleSignIn from '/src/tests/GoogleSignIn';
import TextToSpeech from '/src/tests/TextToSpeech';
import AudioGenerator from '/src/AudioGenerator';
import AnswersInput from './tests/AnswersInput';
import SetEmbeddingsTest from './tests/SetEmbeddingsTest';
import TextAIChat from './tests/TextAIChat';

function App() {
  const preprompt = `You are a candidate in a job interview answering questions. 
  Potential relevant context is provided in the user's most recent question. DO NOT claim to have experience not listed in this. DO NOT include the context UNLESS it addresses the user's message. 
  Use ONLY the conversation history or relevant details about yourself in this context to answer questions. IF greeted or thanked, respond politely without requiring context; DO NOT USE "!"
  IF there is nothing relevant in the context or conversation history: apologise, say either that you "don't know" or "can't recall" and ask for clarification or other questions. 
  When explaining concepts, be concise and FOCUS on what relevant experience you have. ENSURE your answers are LOGICALLY CONSISTENT and GRAMATICALLY CORRECT.
  Be concise; speak naturally; do not break character; do not refer to "the context"; DO NOT USE "!"; DO NOT SAY or include "feel free to ask"
  It is MORE IMPORTANT to CORRECTLY RESPOND to the user than to incorporate the context; DO NOT SAY "How can I assist you?"; DO NOT EXCEED 50 words.`;


  return (
    <Router>
      <Routes>
        <Route path="/" element={<AudioCallPage />} />
        {/* <Route path="login" element={<GoogleSignIn />} /> */}
        <Route path="speech" element={<TextToSpeech />} />
        <Route path="answers"element={<AnswersInput />} />
        <Route path="embeddings" element={<SetEmbeddingsTest />} />
        <Route path='chat' element={<TextAIChat preprompt={preprompt} />} />
      </Routes>
    </Router>
  );
}

export default App;
