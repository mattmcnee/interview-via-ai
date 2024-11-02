import React from 'react';

const Recap = ({ savedTranscript, setMeetingState }) => {
    return (
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
    );
};

export default Recap;