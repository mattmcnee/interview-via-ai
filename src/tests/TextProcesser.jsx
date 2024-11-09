import React, { useState } from 'react';

const TextProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const processText = (text) => {
    return text.split(' ').map(word => {
      // Remove trailing punctuation for processing
      const trimmedWord = word.replace(/[.,!?;]$/, '');
      const punctuation = word.slice(trimmedWord.length); // Keep the punctuation
    
      // Separate letters in fully capitalized words, allowing for an 's' at the end
      if (/^[A-Z]+s?$/.test(trimmedWord)) {
        const lastChar = trimmedWord.charAt(trimmedWord.length - 1) === 's' ? 's' : '';
        const baseWord = lastChar ? trimmedWord.slice(0, -1) : trimmedWord;
        return baseWord.split('').join(' ') + (lastChar ? `'` + lastChar : '') + punctuation;
      }
    
      // Replace '-' and '.' only if they have letters or numbers on either side
      return trimmedWord.replace(/(?<=\w)[-.]+(?=\w)/g, ' ') + punctuation;
    }).join(' ').replace(/\bjs\b/g, 'J S'); // Replace "js" with "J S" 
  };

  const handleChange = (event) => {
    const newText = event.target.value;
    setInputText(newText);
    const processedText = processText(newText);
    setOutputText(processedText);
  };

  return (
    <div>
      <h1>Text Processor</h1>
      <textarea
        rows="5"
        cols="40"
        value={inputText}
        onChange={handleChange}
        placeholder="Type your text here..."
      />
      <h2>Processed Output:</h2>
      <div>{outputText}</div>
    </div>
  );
};

export default TextProcessor;
