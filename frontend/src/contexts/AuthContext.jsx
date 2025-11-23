import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Remove trailing slash to avoid double slashes in API calls
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/$/, '');

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Fetch user data from /user/me
            fetch(`${BACKEND_URL}/user/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('token');
                    setUser(null);
                    return null;
                }
            })
            .then(data => {
                if (data && data.user) {
                    setUser(data.user);
                }
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                localStorage.removeItem('token');
                setUser(null);
            });
        } else {
            setUser(null);
        }
    }, [])

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: 'Login failed' }));
                return data.message || 'Login failed';
            }

            const data = await response.json();

            // Store token in localStorage
            localStorage.setItem('token', data.token);

            // Fetch user data and update state
            const userResponse = await fetch(`${BACKEND_URL}/user/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData.user);
            }

            // Navigate to profile
            navigate('/profile');
            return null;
        } catch (error) {
            return 'Network error: ' + error.message;
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/success".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: 'Registration failed' }));
                return data.message || 'Registration failed';
            }

            // Navigate to success page
            navigate('/success');
            return null;
        } catch (error) {
            return 'Network error: ' + error.message;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
