import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss';

import OpenAIPage from './OpenAIPage';
import EmbeddingTester from './EmbeddingTester';
import AnswersInput from './AnswersInput';
import SpeechToText from './SpeechToText';
import AudioStreamer from './AudioStreamer';
import AudioTranscriber from './AudioTranscriber';
import MicToText from './MicToText';
import AudioCallPage from './call/AudioCallPage';

import Speaker from './call/meeting/Speaker';
import TextProcessor from './TextProcesser';
import LoadingBar from './components/LoadingBar';

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
        <Route path="/stream" element={<AudioTranscriber />} />
        <Route path="/mic" element={<MicToText />} />
        <Route path="/call" element={<AudioCallPage />} />

        {/* <Route path="/speech" element={<Speaker />} /> */}

        <Route path="/text" element={<TextProcessor />} />

        <Route path='/loading' element={<LoadingBar/>} />

      </Routes>
    </Router>
  );
}

export default App;
