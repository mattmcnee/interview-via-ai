// src/OpenAIPage.js
import React, { useState } from 'react';
import axios from 'axios';

import SimilarDocumentsButton from './SimilarDocumentsButton';
import StopVMButton from './components/StopVMButton';

const OpenAIPage = () => {
    return (
        <div>
            {/* <h1>OpenAI API Interaction</h1>
            <SimilarDocumentsButton/> */}

            <StopVMButton/>
        </div>
    );
};

export default OpenAIPage;
