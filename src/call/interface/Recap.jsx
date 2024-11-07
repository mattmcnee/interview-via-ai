import React from 'react';
import { useNavigate } from 'react-router-dom';
import HexagonButton from '/src/components/HexagonButton';

const Recap = ({ savedTranscript, setMeetingState }) => {
    const navigate = useNavigate();

    return (
        <div style={{display:'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '860px', margin: ' 0 auto', height: '100vh', padding: '50px 30px'}}>
            <div style={{display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center', width: '100%'}}>
            <h1>Recap</h1>
            <p>Here is the summary of your audio call:</p>
                <div style={{maxHeight: '300px', overflow: 'auto'}}>
            <ul>
                {savedTranscript.map((transcript, index) => (
                    <li key={index}>{transcript.role}: {transcript.text}</li>
                ))}
            </ul>
            </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                <HexagonButton 
                    size={60}
                    content={"Restart Meeting"} 
                    contentWidth={115} 
                    isExpanded={true}   
                    action={() => setMeetingState('entry')} 
                    fill={false}
                    backgroundColor={"#ddd"}
                    color='#000'
                />
                <HexagonButton 
                    size={60}
                    content={"Return Home"} 
                    contentWidth={95} 
                    isExpanded={true}   
                    action={() => navigate('/')}
                    fill={true}
                    backgroundColor={"#000"}
                    color='#fff'
                />
            </div>
        </div>
    );
};

export default Recap;
