import { Task } from '../models/Task';
import { LoggingService } from './LoggingService';
import { AuthService } from './AuthService';
import { getFirestoreDb } from '../config/firebase';
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '../config/firebase';

export interface TaskWithSyncStatus extends Task {
    syncStatus?: 'synced' | 'pending' | 'error';
    lastSyncAttempt?: Date;
}

export class TaskService {
    private tasks: TaskWithSyncStatus[] = [];
    private unsubscribeRemote: (() => void) | null = null;
    private isOnline: boolean = navigator.onLine;
    private pendingSync: Set<string> = new Set();
    private syncRetryTimeout: NodeJS.Timeout | null = null;
    private syncListeners: Set<(status: { syncing: boolean, pending: number }) => void> = new Set();
    private initialized = false;
    private offlineSyncInterval: number | null = null;
    private tasksListeners: Set<(tasks: TaskWithSyncStatus[]) => void> = new Set();

    constructor() {
        // Removed automatic setup to prevent duplicate listeners;
    }

    /** Initialize service: ensure Firebase persistence enabled before subscribing */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
        // Ensure Firebase initialized with offline persistence
        try {
            await initializeFirebase();
        } catch (err) {
            console.error('[TaskService] initializeFirebase error:', err);
        }
        this.subscribeRemote();
    }

    /** Subscribe to Firestore for real-time updates */
    private subscribeRemote(): void {
        const user = AuthService.getCurrentUser();
        if (!user) return;
        const db = getFirestoreDb();
        const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid)
        );
        this.unsubscribeRemote = onSnapshot(
            tasksQuery,
            (snapshot) => {
                // Map Firestore docs to TaskWithSyncStatus using metadata
                const remoteTasks: TaskWithSyncStatus[] = snapshot.docs.map(docSnap => {
                    const data = docSnap.data() as any;
                    const createdTs = data.createdAt;
                    const hasPendingWrites = docSnap.metadata.hasPendingWrites;
                    return {
                        id: docSnap.id,
                        title: data.title,
                        complexity: data.complexity,
                        urgency: data.urgency,
                        createdAt: createdTs && typeof createdTs.toDate === 'function'
                            ? createdTs.toDate()
                            : new Date(),
                        isCompleted: data.isCompleted,
                        syncStatus: hasPendingWrites ? 'pending' : 'synced',
                        lastSyncAttempt: new Date()
                    } as TaskWithSyncStatus;
                });
                this.tasks = remoteTasks;
                this.tasksListeners.forEach(cb => cb([...this.tasks]));
                console.log('[TaskService] Tasks updated from Firestore:', this.tasks);
            },
            (error) => {
                // Ignore channel termination 400 errors from Firestore streaming
                const msg = (error as any).message || '';
                if (msg.includes('400') && msg.includes('Listen/channel')) {
                    console.warn('[TaskService] Firestore subscription terminated (400):', msg);
                } else {
                    console.error('[TaskService] Firestore subscription error:', error);
                }
            }
        );
    }

    onTasksChange(callback: (tasks: TaskWithSyncStatus[]) => void): () => void {
        this.tasksListeners.add(callback);
        callback([...this.tasks]);

        return () => {
            this.tasksListeners.delete(callback);
            if (this.unsubscribeRemote) {
                this.unsubscribeRemote();
                this.unsubscribeRemote = null;
            }
        };
    }

    async addTask(task: Task): Promise<void> {
        console.log('[TaskService] addTask called for task:', task);
        this.tasks.push(task);
        this.tasksListeners.forEach(cb => cb([...this.tasks]));

        const user = AuthService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const db = getFirestoreDb();
        // Fire-and-forget: create task with client-generated ID to satisfy security rules
        setDoc(doc(db, 'tasks', task.id), {
            id: task.id,
            title: task.title,
            complexity: task.complexity,
            urgency: task.urgency,
            isCompleted: task.isCompleted,
            userId: user.uid,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp()
        })
        .then(() => console.log('[TaskService] Task added to Firestore:', task.id))
        .catch(err => console.error('[TaskService] addTask sync error:', err));
    }

    removeTask(taskId: string): Promise<void> {
        console.log('[TaskService] removeTask called for id:', taskId);
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.tasksListeners.forEach(cb => cb([...this.tasks]));

        // Firestore offline persistence will queue this delete if offline
        const user = AuthService.getCurrentUser();
        if (user) {
            const db = getFirestoreDb();
            deleteDoc(doc(db, 'tasks', taskId))
                .then(() => console.log('[TaskService] Task deleted from Firestore:', taskId))
                .catch(err => console.error('[TaskService] removeTask sync error:', err));
        }
        return Promise.resolve();
     }

    updateTask(updatedTask: Task): Promise<void> {
        console.log('[TaskService] updateTask called for', updatedTask.id, updatedTask);
        if (!updatedTask.id) return Promise.resolve();

        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            this.tasks[index] = { ...updatedTask };
            this.tasksListeners.forEach(cb => cb([...this.tasks]));

            // Firestore offline persistence will queue this update if offline
             const user = AuthService.getCurrentUser();
             if (user) {
                 const db = getFirestoreDb();
                 setDoc(doc(db, 'tasks', updatedTask.id), {
                     id: updatedTask.id,
                     title: updatedTask.title,
                     complexity: updatedTask.complexity,
                     urgency: updatedTask.urgency,
                     isCompleted: updatedTask.isCompleted,
                     userId: user.uid,
                     lastModified: serverTimestamp()
                 }, { merge: true })
                 .then(() => console.log('[TaskService] Task updated in Firestore:', updatedTask.id))
                 .catch(err => console.error('[TaskService] updateTask sync error:', err));
             }
        }

        return Promise.resolve();
     }

    async toggleTaskComplete(taskId: string): Promise<void> {
        console.log('[TaskService] toggleTaskComplete called for', taskId);
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.isCompleted = !task.isCompleted;
            this.tasksListeners.forEach(cb => cb([...this.tasks]));
            // Firestore offline persistence will queue this update if offline
            const user = AuthService.getCurrentUser();
            if (user) {
                const db = getFirestoreDb();
                setDoc(doc(db, 'tasks', taskId), {
                    isCompleted: task.isCompleted,
                    lastModified: serverTimestamp()
                }, { merge: true })
                .then(() => console.log('[TaskService] Task completion toggled in Firestore:', taskId))
                .catch(err => console.error('[TaskService] toggleTaskComplete sync error:', err));
            }
        }
     }

    /**
     * Clean up all listeners and pending operations
     */
    destroy(): void {
        if (!this.initialized) return;
        // Clear local tasks to avoid showing stale data on next user
        this.tasks = [];
        if (this.unsubscribeRemote) {
            this.unsubscribeRemote();
            this.unsubscribeRemote = null;
        }
        // local state cleared on destroy
        this.tasksListeners.clear();
        this.syncListeners.clear();
        this.pendingSync.clear();
        this.initialized = false;
        console.log('[TaskService] destroy called - cleaned up resources');
     }

     /**
      * Get a task by its ID from local state
      */
     getTaskById(taskId: string): TaskWithSyncStatus | undefined {
         return this.tasks.find(t => t.id === taskId);
     }
}

export const taskService = new TaskService();