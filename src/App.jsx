import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss';
import AudioCallPage from './call/AudioCallPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<AudioCallPage />} />
      </Routes>
    </Router>
  );
}

export default App;
