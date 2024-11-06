import React, { useState } from 'react';
import axios from 'axios';
import HexagonButton from '/src/components/HexagonButton';

const Entry = ({ setMeetingState }) => {

    return (
        <div style={{display:'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '860px', margin: ' 0 auto', height: '100vh', padding: '50px 30px'}}>
            <div style={{display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center', width: '100%'}}>
                <h1>Audio Call</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                <HexagonButton 
                    size={60}
                    content={"Enter Meeting"} 
                    contentWidth={105} 
                    isExpanded={true}   
                    action={() => setMeetingState("loading")}
                    fill={true}
                    backgroundColor={"#000"}
                    color='#fff'
                />
            </div>
        </div>
    );
};

export default Entry;