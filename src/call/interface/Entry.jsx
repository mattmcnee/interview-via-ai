import React from 'react';

const Entry = ({ setMeetingState }) => {
    return (
        <div>
            <h1>Audio Call</h1>
            <button onClick={() => setMeetingState("loading")}>Enter Meeting</button>
        </div>
    );
};

export default Entry;

