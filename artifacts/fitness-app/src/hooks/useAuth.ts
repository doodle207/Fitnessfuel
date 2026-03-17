import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);
        const { user: userData, error } = await supabase.auth.signIn({ email, password });
        setLoading(false);
        if (error) throw error;
        setUser(userData);
    };

    const signup = async (email, password) => {
        setLoading(true);
        const { user: userData, error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) throw error;
        setUser(userData);
    };

    const loginWithGoogle = async () => {
        setLoading(true);
        const { user: userData, error } = await supabase.auth.signIn({ provider: 'google' });
        setLoading(false);
        if (error) throw error;
        setUser(userData);
    };

    const logout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        setLoading(false);
        if (error) throw error;
        setUser(null);
    };

    return { user, login, signup, loginWithGoogle, logout, loading };
};

export default useAuth;