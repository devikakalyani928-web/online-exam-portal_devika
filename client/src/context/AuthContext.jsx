import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const TOKEN_KEY = 'auth_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const fetchMe = async (jwt) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error('Unable to fetch user');
      const data = await res.json();
      setUser(data);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const msg = (await res.json())?.message || 'Login failed';
      throw new Error(msg);
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.message || body?.errors?.[0]?.msg || 'Registration failed';
      throw new Error(msg);
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        token: token || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

