import React, { useState } from 'react';
import { AudioCallProvider } from './AudioCallContext';
import Listener from './Listener';
import Responder from './Responder';
import Speaker from './Speaker';

const AudioCallPage = () => {
  const [meetingState, setMeetingState] = useState('entry');
  const [savedTranscript, setSavedTranscript] = useState([]);

  const handleEnterMeeting = () => {
    setMeetingState('loading');
    
    // Simulate loading with a timeout (replace with actual loading logic as needed)
    setTimeout(() => {
      setMeetingState('meeting');
    }, 2000); // Simulate a 2-second loading time
  };

  return (
    <>
      {meetingState === 'entry' && (
        <div>
          <h1>Audio Call</h1>
          <button onClick={handleEnterMeeting}>Enter Meeting</button>
        </div>
      )}

      {meetingState === 'loading' && (
        <div>
          <h1>Loading...</h1>
          <p>Please wait while we prepare your audio call.</p>
        </div>
      )}

      {meetingState === 'meeting' && (
        <AudioCallProvider setMeetingState={setMeetingState} setSavedTranscript={setSavedTranscript}>
          <Listener />
          <Responder />
          <Speaker />
        </AudioCallProvider>
      )}

      {meetingState === 'recap' && (
        <div>
          <h1>Recap</h1>
          <p>Here is the summary of your audio call:</p>
          <ul>
            {savedTranscript.map((transcript, index) => (
              <li key={index}>{transcript}</li>
            ))}
          </ul>
          <button onClick={() => setMeetingState('entry')}>Start New Meeting</button>
        </div>
      )}
    </>
  );
};

export default AudioCallPage;
