import React, { useState, useCallback, useEffect } from 'react';
import { AuthService } from '../services/AuthService';

interface AuthProps {
    onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [email, setEmail] = useState('admin@dailyorganizer.com');
    const [password, setPassword] = useState('1234');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isOnline) {
            setError('No hay conexión a internet. Por favor, verifica tu conexión y vuelve a intentar.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await AuthService.signIn(email, password);
            } else {
                await AuthService.signUp(email, password);
            }
            onAuthSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de autenticación');
            // Sacudir el formulario
            const form = (e.target as HTMLFormElement);
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
        } finally {
            setLoading(false);
        }
    }, [email, password, isLogin, onAuthSuccess, isOnline]);

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
                
                {!isOnline && (
                    <div className="auth-offline-warning">
                        <span className="offline-icon">⚠️</span>
                        <span>Sin conexión a internet</span>
                    </div>
                )}
                
                {error && (
                    <div className="auth-error" role="alert">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="auth-field">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="auth-submit"
                        disabled={loading || !isOnline}
                    >
                        {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                    </button>
                </form>
                
                <button 
                    className="auth-toggle"
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                    }}
                    disabled={loading}
                >
                    {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
                
                <div className="auth-info">
                    <p>Credenciales por defecto:</p>
                    <code>Email: admin@dailyorganizer.com</code><br/>
                    <code>Contraseña: 1234</code>
                </div>
                
                {loading && (
                    <div className="auth-loading">
                        <div className="auth-loading-spinner" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
