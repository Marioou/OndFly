import React, { useState, useEffect } from 'react';

export const ConnectivityStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        function handleOnline() { setIsOnline(true); }
        function handleOffline() { setIsOnline(false); }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const message = isOnline ? 'Conectado' : 'Sin conexión';

    return (
        <div className={ `connectivity-status ${isOnline ? 'online' : 'offline'}` }>
            <span className="status-dot" />
            {message}
        </div>
    );
};

export default ConnectivityStatus;
