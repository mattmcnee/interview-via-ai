import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss';
import AudioCallPage from './call/AudioCallPage';
import GoogleSignIn from '/src/tests/GoogleSignIn';
import TextToSpeech from '/src/tests/TextToSpeech';
import AudioGenerator from '/src/AudioGenerator';
import AnswersInput from './tests/AnswersInput';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AudioCallPage />} />
        {/* <Route path="login" element={<GoogleSignIn />} /> */}
        <Route path="speech" element={<TextToSpeech />} />
        <Route path="answers"element={<AnswersInput />} />
      </Routes>
    </Router>
  );
}

export default App;
