import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    User,
    AuthError
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { LoggingService } from './LoggingService';

export class AuthService {
    private static ADMIN_EMAIL = 'admin@dailyorganizer.com';
    private static ADMIN_PASSWORD = '1234';
    private static MAX_RETRIES = 3;
    private static RETRY_DELAY = 1000; // 1 segundo

    private static async retryOperation<T>(
        operation: () => Promise<T>,
        retries = this.MAX_RETRIES
    ): Promise<T> {
        let lastError: Error;
        
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                
                // No reintentar para ciertos errores
                if (
                    error.code === 'auth/user-disabled' ||
                    error.code === 'auth/user-not-found' ||
                    error.code === 'auth/wrong-password' ||
                    error.code === 'auth/email-already-in-use'
                ) {
                    throw error;
                }

                // Para errores de red o servidor, reintentar
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (i + 1)));
                    continue;
                }
            }
        }
        
        throw lastError!;
    }

    private static getErrorMessage(error: AuthError): string {
        if (!navigator.onLine) {
            return 'No hay conexión a internet. Por favor, verifica tu conexión y vuelve a intentar.';
        }

        switch (error.code) {
            case 'auth/invalid-email':
                return 'El correo electrónico no es válido';
            case 'auth/user-disabled':
                return 'Esta cuenta ha sido deshabilitada';
            case 'auth/user-not-found':
                return 'No existe una cuenta con este correo';
            case 'auth/wrong-password':
                return 'Contraseña incorrecta';
            case 'auth/email-already-in-use':
                return 'Este correo ya está registrado';
            case 'auth/weak-password':
                return 'La contraseña debe tener al menos 6 caracteres';
            case 'auth/network-request-failed':
                return 'Error de conexión. Por favor verifica tu conexión a internet y vuelve a intentar.';
            case 'auth/too-many-requests':
                return 'Demasiados intentos fallidos. Por favor, espera unos minutos antes de volver a intentar.';
            case 'auth/operation-not-allowed':
                return 'El inicio de sesión está temporalmente deshabilitado. Por favor, intenta más tarde.';
            default:
                return `Error de autenticación (${error.code}). Por favor, intenta de nuevo más tarde.`;
        }
    }

    static async signIn(email: string, password: string): Promise<User> {
        try {
            const firebaseAuth = getFirebaseAuth();
            const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
            
            LoggingService.info(
                'Inicio de sesión exitoso',
                userCredential.user.uid,
                { email }
            );
            
            return userCredential.user;
        } catch (error: any) {
            // Si el error es de usuario no encontrado y son las credenciales de admin
            if (error.code === 'auth/user-not-found' && 
                email === this.ADMIN_EMAIL && 
                password === this.ADMIN_PASSWORD) {
                return this.signUp(email, password);
            }
            
            const errorMessage = this.getErrorMessage(error);
            const currentUid = getFirebaseAuth().currentUser?.uid;
            LoggingService.error(
                'Error en inicio de sesión',
                currentUid,
                { error: error.code, email }
            );
            throw new Error(errorMessage);
        }
    }

    static async signUp(email: string, password: string): Promise<User> {
        try {
            const firebaseAuth = getFirebaseAuth();
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            
            LoggingService.info(
                'Usuario registrado exitosamente',
                userCredential.user.uid,
                { email }
            );
            
            return userCredential.user;
        } catch (error: any) {
            const errorMessage = this.getErrorMessage(error);
            const currentUid = getFirebaseAuth().currentUser?.uid;
            LoggingService.error(
                'Error en registro',
                currentUid,
                { error: error.code, email }
            );
            throw new Error(errorMessage);
        }
    }

    static async signOut(): Promise<void> {
        const firebaseAuth = getFirebaseAuth();
        const userId = firebaseAuth.currentUser?.uid;
        try {
            await this.retryOperation(() => firebaseSignOut(firebaseAuth));
            LoggingService.info('Cierre de sesión exitoso', userId);
        } catch (error: any) {
            LoggingService.error(
                'Error en cierre de sesión',
                userId,
                { error: error.code }
            );
            throw new Error('Error al cerrar sesión. Por favor, intenta de nuevo.');
        }
    }

    static getCurrentUser(): User | null {
        return getFirebaseAuth().currentUser;
    }

    static onAuthStateChanged(callback: (user: User | null) => void): () => void {
        return getFirebaseAuth().onAuthStateChanged(callback);
    }
}
