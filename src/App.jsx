import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss';
import AudioCallPage from './call/AudioCallPage';
import GoogleSignIn from '/src/tests/GoogleSignIn';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AudioCallPage />} />
        <Route path="login" element={<GoogleSignIn />} />
      </Routes>
    </Router>
  );
}

export default App;
