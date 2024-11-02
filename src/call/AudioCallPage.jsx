import React from 'react';
import { AudioCallProvider } from './AudioCallContext';
import Listener from './Listener';
import Responder from './Responder';
import Speaker from './Speaker';


const AudioCallPage = () => {
  return (
    <AudioCallProvider>
        <Listener />
        <Responder />
        <Speaker />
    </AudioCallProvider>
  );
};

export default AudioCallPage;