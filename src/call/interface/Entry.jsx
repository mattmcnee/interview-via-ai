import React, { useState } from 'react';
import { auth, GoogleAuthProvider, signInWithPopup, signOut } from '/src/firebase';
import HexagonButton from '/src/components/HexagonButton';

const Entry = ({ setMeetingState }) => {
    const [user, setUser] = useState(null);

    // Sign in with Google
    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            setUser({
                name: user.displayName,
                email: user.email,
            });
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    // Sign out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            maxWidth: '860px', 
            margin: '0 auto', 
            height: '100vh', 
            padding: '50px 30px'
        }}>
            <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                flex: '1', 
                justifyContent: 'center', 
                width: '100%'
            }}>
                {user ? (
                    <div>
                        <h2>Welcome, {user.name}</h2>
                        <p>Email: {user.email}</p>
                    </div>
                ) : (
                    <div>
                        <h2>Welcome </h2>
                        <p>Please sign in with your Google Account to enter the meeting.</p>
                    </div>
                )}
            </div>

            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'flex-end', 
                width: '100%', 
                gap: '10px'
            }}>
                <HexagonButton 
                    size={60}
                    content={user ? "Sign out of Google" : "Sign in with Google"}
                    contentWidth={135}
                    isExpanded={true}
                    action={user ? handleSignOut : handleGoogleSignIn}
                    fill={false}
                    backgroundColor={"#ccc"}
                    color='#000'
                />
                <HexagonButton 
                    size={60}
                    content={"Enter Meeting"}
                    contentWidth={105}
                    isExpanded={user}
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