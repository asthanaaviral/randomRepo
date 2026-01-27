
import React, { createContext, useContext, useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

interface User {
    name: string;
    email: string;
    picture: string;
    access_token: string;
}

interface AuthContextType {
    user: User | null;
    login: () => void;
    loginWithEmail: (email: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                // Fetch user info from Google
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );

                const userData = {
                    ...userInfo.data,
                    access_token: tokenResponse.access_token
                };

                setUser(userData);

            } catch (error) {
                console.error('Login Failed:', error);
            } finally {
                setIsLoading(false);
            }
        },
        onError: error => console.log('Login Failed:', error)
    });

    const logout = () => {
        googleLogout();
        setUser(null);
    };

    const loginWithEmail = (email: string) => {
        setUser({
            name: email.split('@')[0],
            email: email,
            picture: '',
            access_token: 'mock-token'
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, loginWithEmail }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
