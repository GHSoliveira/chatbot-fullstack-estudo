import { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Inicializa o estado lendo do localStorage (para não deslogar no F5)
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (userData, userToken) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
    };

    // HEARTBEAT: Pinga o servidor a cada 10s para dizer "Estou Online"
    useEffect(() => {
        if (user) {
            const beat = setInterval(() => {
                // Envia o ping sem bloquear a interface
                apiRequest('/auth/heartbeat', { method: 'POST' }).catch(() => { });
            }, 10000);

            return () => clearInterval(beat);
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
};