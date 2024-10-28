import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import OpenAIPage from './OpenAIPage';
import EmbeddingTester from './EmbeddingTester';
import AnswersInput from './AnswersInput';
import SpeechToText from './SpeechToText';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for OpenAIPage */}
        <Route path="/" element={<OpenAIPage />} />
        
        {/* Route for EmbeddingTester */}
        <Route path="/embedding" element={<EmbeddingTester />} />
        <Route path="/answers" element={<AnswersInput />} />
        <Route path="/audio" element={<SpeechToText />} />
      </Routes>
    </Router>
  );
}

export default App;
