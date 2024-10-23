import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import OpenAIPage from './OpenAIPage';
import EmbeddingTester from './EmbeddingTester';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for OpenAIPage */}
        <Route path="/" element={<OpenAIPage />} />
        
        {/* Route for EmbeddingTester */}
        <Route path="/embedding" element={<EmbeddingTester />} />
      </Routes>
    </Router>
  );
}

export default App;
