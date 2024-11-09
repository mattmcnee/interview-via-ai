import React from 'react';
import { api } from '/src/utils/api';

// Function to stop VM
const stopVM = async () => {
    try {
        const response = await api.post(`${import.meta.env.VITE_API_URL}/stopVM`);
        console.log("VM stopped:", response);
    } catch (error) {
        console.error("Failed to stop VM:", error);
    }
};

// Function to await VM status
const awaitVMStatus = async (targetStatus, timeout = 50) => {
    try {
        // Prepare the query parameters
        const params = { target: targetStatus, timeout };
        const response = await api.get(`${import.meta.env.VITE_API_URL}/awaitVMStatus`, params);
        console.log("VM status awaited:", response);
    } catch (error) {
        console.error("Failed to await VM status:", error);
    }
};

const FunctionsTest = () => {
    // Handler for the stop VM button click
    const handleStopButtonClick = async () => {
        try {
            await stopVM();
        } catch (error) {
            console.error("Failed to stop VM");
        }
    };

    // Handler for the await VM status button click
    const handleAwaitButtonClick = async () => {
        try {
            const targetStatus = "running"; // Example target status
            const timeout = 50; // Example timeout value
            await awaitVMStatus(targetStatus, timeout);
        } catch (error) {
            console.error("Failed to await VM status");
        }
    };

    return (
        <div>
            <button onClick={handleStopButtonClick}>Stop VM</button>
            <button onClick={handleAwaitButtonClick}>Await VM Status</button>
        </div>
    );
};

export default FunctionsTest;

