import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const AuthCallback = () => {
    const history = useHistory();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            // Simulate an API call to handle the OAuth callback
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
            // Redirect to home page after OAuth handling
            history.push('/');
        };
        handleOAuthCallback();
    }, [history]);

    return (
        <div style={{ textAlign: 'center', marginTop: '20%' }}>
            <h2>Loading...</h2>
            <div className="spinner"></div> {/* Placeholder for spinner */}
        </div>
    );
};

export default AuthCallback;