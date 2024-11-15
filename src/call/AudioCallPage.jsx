import React, { useState } from 'react';
import { AudioCallProvider } from './meeting/AudioCallContext';
import Listener from './meeting/Listener';
import Responder from './meeting/Responder';
import Speaker from './meeting/Speaker';
import Entry from './interface/Entry';
import Loading from './interface/Loading';
import Recap from './interface/Recap';

const AudioCallPage = () => {
  const [meetingState, setMeetingState] = useState('entry');
  const [savedTranscript, setSavedTranscript] = useState([]);
  const [ttsApiPath, setTtsApiPath] = useState(''); // Added state for ttsApiPath

  return (
    <>
      {meetingState === 'entry' && (
        <Entry setMeetingState={setMeetingState} />
      )}

      {meetingState === 'loading' && (
        <Loading setMeetingState={setMeetingState} ttsApiPath={ttsApiPath} setTtsApiPath={setTtsApiPath}/>
      )}

      {meetingState === 'meeting' && (
        <AudioCallProvider setMeetingState={setMeetingState} setSavedTranscript={setSavedTranscript} ttsApiPath={ttsApiPath}>
          <Listener />
          <Responder />
          <Speaker />
        </AudioCallProvider>
      )}

      {meetingState === 'recap' && (
        <Recap savedTranscript={savedTranscript} setMeetingState={setMeetingState} />
      )}
    </>
  );
};

export default AudioCallPage;
