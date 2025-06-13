import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';

export type LogLevel = 'info' | 'warning' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    userId?: string;
    timestamp: Date;
    data?: any;
}

export class LoggingService {
    private static readonly LOGS_COLLECTION = 'logs';
    private static offlineLogs: LogEntry[] = [];
    private static isLogging: boolean = false;

    static async log(level: LogLevel, message: string, userId: string | undefined, data?: any): Promise<void> {
        // Evitar bucles infinitos
        if (this.isLogging) {
            console.log(`[SKIP LOG] ${level}: ${message}`);
            return;
        }

        const logEntry: LogEntry = {
            level,
            message,
            userId,
            timestamp: new Date(),
            data
        };

        // Siempre mostrar en consola para desarrollo
        this.consoleLog(logEntry);

        // Solo intentar Firebase si estamos online y no hay muchos logs pendientes
        if (navigator.onLine && this.offlineLogs.length < 100) {
            this.isLogging = true;
            try {
                await this.syncLog(logEntry);
            } catch (error) {
                // Si falla, guardar para sincronizar más tarde
                this.offlineLogs.push(logEntry);
                console.error('Error syncing log:', error);
            } finally {
                this.isLogging = false;
            }
        } else {
            // Guardar offline
            this.offlineLogs.push(logEntry);
        }
    }

    private static async syncLog(logEntry: LogEntry): Promise<void> {
        try {
            const db = getFirestoreDb();
            await addDoc(collection(db, this.LOGS_COLLECTION), {
                ...logEntry,
                timestamp: Timestamp.fromDate(logEntry.timestamp)
            });
        } catch (error) {
            throw error;
        }
    }

    static async syncOfflineLogs(): Promise<void> {
        if (!navigator.onLine || this.offlineLogs.length === 0) return;

        const logsToSync = [...this.offlineLogs];
        this.offlineLogs = [];

        try {
            await Promise.all(logsToSync.map(log => this.syncLog(log)));
        } catch (error) {
            // Si hay error, devolvemos los logs no sincronizados al array
            this.offlineLogs.push(...logsToSync);
            throw error;
        }
    }

    private static consoleLog(logEntry: LogEntry): void {
        const timestamp = logEntry.timestamp.toISOString();
        const userId = logEntry.userId || 'anonymous';
        const data = logEntry.data ? `\nData: ${JSON.stringify(logEntry.data, null, 2)}` : '';

        switch (logEntry.level) {
            case 'info':
                console.log(`[${timestamp}] [${userId}] ${logEntry.message}${data}`);
                break;
            case 'warning':
                console.warn(`[${timestamp}] [${userId}] ${logEntry.message}${data}`);
                break;
            case 'error':
                console.error(`[${timestamp}] [${userId}] ${logEntry.message}${data}`);
                break;
        }
    }

    static info(message: string, userId: string | undefined, data?: any): void {
        this.log('info', message, userId, data);
    }

    static warning(message: string, userId: string | undefined, data?: any): void {
        this.log('warning', message, userId, data);
    }

    static error(message: string, userId: string | undefined, data?: any): void {
        this.log('error', message, userId, data);
    }
}
