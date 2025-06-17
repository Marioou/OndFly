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
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
        // Listen for service worker update event
        const onUpdate = () => setUpdateAvailable(true);
        window.addEventListener('swUpdated', onUpdate);

        return () => {
            isMounted = false;
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('swUpdated', onUpdate);
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
        <>
            {updateAvailable && (
                <div className="update-banner">
                    <span>Se ha actualizado la aplicación.</span>
                    <button className="reload-button" onClick={() => window.location.reload()}>Recargar</button>
                </div>
            )}
            <div className="App">
                <header className="App-header">
                    {/* Desktop header */}
                    <div className="desktop-header">
                        <div className="header-content">
                            <h1>OnDfly</h1>
                            <div className="version-info">
                                <span>v2.0.0</span>
                                <span className="beta-tag">Beta</span>
                            </div>
                        </div>
                        <div className="account-section">
                            <ConnectivityStatus />
                            <span className="user-email">{user.email}</span>
                            <button onClick={handleSignOut} className="sign-out-button">Cerrar sesión</button>
                        </div>
                    </div>
                    {/* Mobile header */}
                    <div className="mobile-header">
                        <div className="app-title">
                            <h1>OnDfly</h1>
                            <span className="app-subtitle">Daily organizer</span>
                        </div>
                        <button className="menu-icon" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-label="Open profile menu">
                            {/* Hamburger menu icon */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        {profileMenuOpen && (
                            <div className="profile-menu">
                                <button className="profile-item">Perfil</button>
                                <button className="profile-item" onClick={handleSignOut}>Cerrar sesión</button>
                            </div>
                        )}
                    </div>
                </header>
                <main>
                    <TaskList />
                </main>
            </div>
        </>
    );
};

export default App;