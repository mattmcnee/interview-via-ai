import { useState } from 'react'
import './App.css'

import OpenAIPage from './OpenAIPage';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <OpenAIPage/>
    </>
  )
}

export default App
