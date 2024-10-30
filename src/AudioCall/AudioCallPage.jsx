import React from 'react';
import { AudioCallProvider } from './AudioCallContext';
import Listener from './Listener';
import Responder from './Responder';


const AudioCallPage = () => {
  return (
    <AudioCallProvider>
      <div>
        <h1>Audio Call Page</h1>
        <Listener />
        <Responder />
      </div>
    </AudioCallProvider>
  );
};

export default AudioCallPage;