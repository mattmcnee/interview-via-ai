import React, { useState } from 'react';
import { AudioCallProvider } from './AudioCallContext';
import Listener from './Listener';
import Responder from './Responder';
import Speaker from './Speaker';


const AudioCallPage = () => {
  const [enterMeeting, setEnterMeeting] = useState(false);
  return (
    enterMeeting ? (
      <AudioCallProvider>
        <Listener />
        <Responder />
        <Speaker />
      </AudioCallProvider>
    ) : (
      <div>
        <h1>Audio Call</h1>
        <button onClick={() => setEnterMeeting(true)}>Enter Meeting</button>
      </div>
    )
  );
};

export default AudioCallPage;