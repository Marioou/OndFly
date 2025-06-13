import React, { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import Auth from './components/Auth';
import { ConnectivityStatus } from './components/ConnectivityStatus';
import { AuthService } from './services/AuthService';
import { taskService } from './services/TaskService';
import { User } from 'firebase/auth';
import { initializeFirebase } from './config/firebase';
import { LoggingService } from './services/LoggingService';
import './App.css';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        // Async initialize Firebase
        (async () => {
            try {
                await initializeFirebase();
            } catch (error) {
                console.error('[App] initializeFirebase error:', error);
            }
        })();
        // Sync offline logs when regaining connectivity
        function handleOnline() {
            LoggingService.syncOfflineLogs().catch(err => console.error('[App] syncOfflineLogs error:', err));
        }
        window.addEventListener('online', handleOnline);
        // Subscribe auth state
        const unsubscribe = AuthService.onAuthStateChanged((user) => {
            if (isMounted) {
                setUser(user);
                setLoading(false);
            }
        });
        return () => {
            isMounted = false;
            unsubscribe();
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const handleSignOut = async () => {
        // Sign out user and reload to clear cache/state
        try {
            await AuthService.signOut();
            // Full reload to reset Firestore cache and application state
            window.location.reload();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Auth onAuthSuccess={() => {}} />;
    }

    return (
        <div className="App">
            <header className="App-header">
                <div className="header-content">
                    <h1>Organizador Diario</h1>
                    <div className="version-info">
                        <span>v1.4.0</span>
                        <span className="beta-tag">Beta</span>
                    </div>
                </div>
                <div className="account-section">
                    <ConnectivityStatus />
                    <span className="user-email">{user?.email}</span>
                    <button onClick={handleSignOut} className="sign-out-button">
                        Cerrar Sesión
                    </button>
                </div>
            </header>
            <main>
                <TaskList />
            </main>
        </div>
    );
};

export default App;