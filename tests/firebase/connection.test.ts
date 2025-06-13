/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    User,
    inMemoryPersistence,
    setPersistence,
    AuthErrorCodes
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
    enableIndexedDbPersistence,
    DocumentData,
    onSnapshot,
    limit,
    QuerySnapshot,
    DocumentReference
} from 'firebase/firestore';
import { Task } from '../../src/models/Task';
import '../utils/fetch-polyfill';
import { initializeTestFirebase } from '../utils/firebase-test-config';

type TestTask = Omit<Task, 'id'> & {
    userId: string;
};

const handleFirebaseError = (error: any, retryOperation?: () => Promise<void>, maxRetries: number = 3) => {
    const errorInfo = {
        code: error?.code,
        message: error?.message,
        name: error?.name,
        stack: error?.stack
    };

    if (error?.code === 'auth/network-request-failed' && retryOperation) {
        console.warn('Network error detected. Retrying operation...');
        let attempt = 0;
        const retry = async () => {
            while (attempt < maxRetries) {
                try {
                    await retryOperation();
                    return;
                } catch (retryError) {
                    attempt++;
                    console.warn(`Retry attempt ${attempt} failed. Retrying...`);
                    if (attempt >= maxRetries) {
                        console.error('Max retry attempts reached:', retryError);
                        throw retryError;
                    }
                }
            }
        };
        retry();
    } else {
        console.error('Firebase error:', errorInfo);
    }
};

const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            console.log(`Intento ${attempt} fallido, reintentando en ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            // Incrementar el delay para el próximo intento
            delayMs *= 2;
        }
    }
    throw new Error('No se pudo completar la operación después de los reintentos');
};

describe('Firebase Production Connection Tests', () => {
    let app: ReturnType<typeof initializeApp>;
    let auth: ReturnType<typeof getAuth>;
    let db: ReturnType<typeof getFirestore>;
    let testUser: User | null = null; // Explicitly type testUser
    let unsubscribe: (() => void) | null = null;    beforeAll(async () => {
        jest.setTimeout(30000); // 30 seconds for the entire suite

        try {
            const firebase = await initializeTestFirebase();
            app = firebase.app;
            auth = firebase.auth;
            db = firebase.db;
            console.log('Firebase initialized successfully');

            // Verify Firestore connection
            await retryOperation(async () => {
                const testQuery = query(collection(db, 'tasks'), limit(1));
                unsubscribe = onSnapshot(
                    testQuery,
                    snapshot => {
                        console.log('Firestore connection verified');
                    },
                    error => {
                        console.error('Error connecting to Firestore:', error);
                        throw error;
                    }
                );
            });

            // Authenticate test user
            testUser = await retryOperation(async () => {
                const userCredential = await signInWithEmailAndPassword(auth, 'admin@dailyorganizer.com', '123456');
                console.log('Authenticated user:', userCredential.user.email);
                return userCredential.user;
            });
        } catch (error) {
            console.error('Error during Firebase initialization:', error);
            throw error;
        }
    }, 30000);

    // Ensure resources are cleaned up after tests
    afterAll(async () => {
        if (unsubscribe) {
            unsubscribe();
            console.log('Firestore listener unsubscribed');
        }
        if (app) {
            await deleteApp(app); // Use deleteApp for cleanup
            console.log('Firebase app deleted');
        }
    });

    test('should connect to Firebase Production successfully', async () => {
        expect(app).toBeDefined();
        expect(auth).toBeDefined();
        expect(db).toBeDefined();

        // Verificar autenticación
        expect(testUser).not.toBeNull();
        if (testUser) {
            expect(testUser.email).toBe('admin@dailyorganizer.com');
            console.log('Usuario autenticado:', testUser.email);
        }

        // Verificar conexión a Firestore
        await retryOperation(async () => {            const testCollection = collection(db, 'tasks');
            const testQuery = query(testCollection, limit(1));
            const snapshot = await getDocs(testQuery);
            expect(snapshot).toBeDefined();
            console.log('Conexión a Firestore verificada');
        });
    }, 30000);

    test('should perform CRUD operations in Production', async () => {
        if (!testUser) {
            throw new Error('No hay usuario autenticado');
        }

        const TEST_COLLECTION = 'tasks';
        console.log('Iniciando pruebas CRUD...');
        
        const testTask: TestTask = {
            title: 'Test Task Production',
            complexity: 'medium',
            urgency: 'high',
            userId: testUser.uid,
            createdAt: new Date(),
            isCompleted: false
        };

        try {
            // Create
            let docRef: DocumentReference;
            await retryOperation(async () => {
                console.log('Creando tarea de prueba...');
                docRef = await addDoc(collection(db, TEST_COLLECTION), testTask);
                expect(docRef.id).toBeDefined();
                console.log('Tarea creada con ID:', docRef.id);
            });

            // Read
            await retryOperation(async () => {
                console.log('Verificando la tarea creada...');
                const q = query(
                    collection(db, TEST_COLLECTION),
                    where('userId', '==', testUser?.uid),
                    where('title', '==', testTask.title)
                );
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    throw new Error('No se encontró la tarea creada');
                }

                const tasks = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as TestTask)
                }));
                const createdTask = tasks.find(task => task.id === docRef.id);
                
                expect(createdTask).toBeDefined();
                expect(createdTask?.title).toBe(testTask.title);
                console.log('Tarea verificada correctamente');
            });

            // Delete
            await retryOperation(async () => {
                console.log('Eliminando tarea de prueba...');
                await deleteDoc(doc(db, TEST_COLLECTION, docRef.id));
                console.log('Tarea eliminada');

                // Verify deletion
                const q = query(
                    collection(db, TEST_COLLECTION),
                    where('userId', '==', testUser?.uid),
                    where('title', '==', testTask.title)
                );
                const verifyQuery = await getDocs(q);
                const deletedTask = verifyQuery.docs.find(doc => doc.id === docRef.id);
                expect(deletedTask).toBeUndefined();
                console.log('Eliminación verificada');
            });        } catch (error) {
            handleFirebaseError(error);
            throw error;
        }
    }, 30000);

    test('should handle offline operations with Production server', async () => {
        if (!testUser) {
            throw new Error('No hay usuario autenticado');
        }

        // Simular offline
        const originalOnlineStatus = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', { value: false });
        console.log('Modo offline simulado');

        try {
            const TEST_COLLECTION = 'tasks';
            const testTask: TestTask = {
                title: 'Offline Task Production',
                complexity: 'low',
                urgency: 'medium',
                userId: testUser.uid,
                createdAt: new Date(),
                isCompleted: false
            };

            // Crear documento en modo offline
            console.log('Intentando crear tarea en modo offline...');
            const docRef = await addDoc(collection(db, TEST_COLLECTION), testTask);
            expect(docRef.id).toBeDefined();
            console.log('Tarea creada offline con ID:', docRef.id);

            // Restaurar online
            Object.defineProperty(navigator, 'onLine', { value: true });
            console.log('Conexión restaurada');

            // Esperar a que se sincronice
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Verificar sincronización
            console.log('Verificando sincronización...');
            const q = query(
                collection(db, TEST_COLLECTION),
                where('userId', '==', testUser.uid),
                where('title', '==', testTask.title)
            );
            
            const querySnapshot = await getDocs(q);
            expect(querySnapshot.empty).toBeFalsy();
            console.log('Sincronización verificada');

            // Limpiar
            console.log('Limpiando datos de prueba...');
            for (const doc of querySnapshot.docs) {
                await deleteDoc(doc.ref);
            }
            console.log('Datos de prueba eliminados');

        } catch (error) {
            handleFirebaseError(error);
            throw error;        } finally {
            Object.defineProperty(navigator, 'onLine', { value: originalOnlineStatus });
            console.log('Estado de conexión restaurado');
        }
    }, 30000);
});

describe('Firebase Connection Retry Logic', () => {
    it('should retry on auth/network-request-failed error', async () => {
        const mockOperation = jest.fn()
            .mockRejectedValueOnce({ code: 'auth/network-request-failed' })
            .mockRejectedValueOnce({ code: 'auth/network-request-failed' })
            .mockResolvedValue('Success');

        const result = await retryOperation(mockOperation, 3, 100);
        expect(result).toBe('Success');
        expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
        const mockOperation = jest.fn()
            .mockRejectedValueOnce({ code: 'auth/network-request-failed' })
            .mockRejectedValueOnce({ code: 'auth/network-request-failed' })
            .mockRejectedValueOnce({ code: 'auth/network-request-failed' });

        await expect(retryOperation(mockOperation, 3, 100)).rejects.toThrow('No se pudo completar la operación después de los reintentos');
        expect(mockOperation).toHaveBeenCalledTimes(3);
    });
});
