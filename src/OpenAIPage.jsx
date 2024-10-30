// src/OpenAIPage.js
import React, { useState } from 'react';
import axios from 'axios';

import SimilarDocumentsButton from './SimilarDocumentsButton';

const OpenAIPage = () => {
    return (
        <div>
            <h1>OpenAI API Interaction</h1>
            <SimilarDocumentsButton/>
        </div>
    );
};

export default OpenAIPage;
