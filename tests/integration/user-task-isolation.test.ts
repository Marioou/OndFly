/**
 * Test de integración para verificar el aislamiento de tareas por usuario
 * Este test verifica que las tareas se almacenen y recuperen correctamente
 * para usuarios específicos sin interferencias.
 */

import { AuthService } from '../../src/services/AuthService';
import { taskService } from '../../src/services/TaskService';
import { Task } from '../../src/models/Task';
import '../utils/fetch-polyfill';
import { initializeTestFirebase } from '../utils/firebase-test-config';

describe('User Task Isolation Integration Tests', () => {
    beforeAll(async () => {
        // Mock the window object for tests if not already defined
        if (!global.window) {
            Object.defineProperty(global, 'window', {
                value: {
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    navigator: { onLine: true },
                },
                writable: true,
            });
        }

        await initializeTestFirebase();
        taskService.initialize();
    }, 30000);

    afterAll(async () => {
        try {
            await AuthService.signOut();
            taskService.destroy();
        } catch (error) {
            console.log('Cleanup error:', error);
        }
    });

    test('should isolate tasks between different users', async () => {
        // Usuario 1: admin@dailyorganizer.com
        const user1 = await AuthService.signIn('admin@dailyorganizer.com', '123456');
        expect(user1).toBeDefined();
        expect(user1.email).toBe('admin@dailyorganizer.com');

        // Crear una tarea para el usuario 1
        const task1: Task = {
            id: `task1-${Date.now()}`,
            title: 'Tarea del Usuario 1',
            complexity: 'medium',
            urgency: 'high',
            createdAt: new Date(),
            isCompleted: false
        };

        await taskService.addTask(task1);
        
        // Esperar un momento para que se sincronice
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar que la tarea existe para el usuario 1
        const user1Tasks = taskService.getTasks();
        expect(user1Tasks).toHaveLength(1);
        expect(user1Tasks[0].title).toBe('Tarea del Usuario 1');

        // Cerrar sesión del usuario 1
        await AuthService.signOut();
        
        // Esperar un momento para el cambio de estado
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar que las tareas se limpian al cerrar sesión
        const noUserTasks = taskService.getTasks();
        expect(noUserTasks).toHaveLength(0);

        // Crear otro usuario (si no existe, se creará automáticamente)
        let user2;
        try {
            user2 = await AuthService.signIn('test@dailyorganizer.com', '123456');
        } catch (error) {
            user2 = await AuthService.signUp('test@dailyorganizer.com', '123456');
        }
        
        expect(user2).toBeDefined();
        expect(user2.email).toBe('test@dailyorganizer.com');

        // Esperar un momento para que se carguen las tareas del usuario 2
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar que el usuario 2 no ve las tareas del usuario 1
        const user2InitialTasks = taskService.getTasks();
        expect(user2InitialTasks).not.toContainEqual(
            expect.objectContaining({ title: 'Tarea del Usuario 1' })
        );

        // Crear una tarea para el usuario 2
        const task2: Task = {
            id: `task2-${Date.now()}`,
            title: 'Tarea del Usuario 2',
            complexity: 'low',
            urgency: 'medium',
            createdAt: new Date(),
            isCompleted: false
        };

        await taskService.addTask(task2);
        
        // Esperar sincronización
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar que el usuario 2 solo ve su tarea
        const user2Tasks = taskService.getTasks();
        expect(user2Tasks.some(task => task.title === 'Tarea del Usuario 2')).toBe(true);
        expect(user2Tasks.some(task => task.title === 'Tarea del Usuario 1')).toBe(false);

        // Volver al usuario 1
        await AuthService.signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await AuthService.signIn('admin@dailyorganizer.com', '123456');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar que el usuario 1 recupera sus tareas
        const user1TasksAgain = taskService.getTasks();
        expect(user1TasksAgain.some(task => task.title === 'Tarea del Usuario 1')).toBe(true);
        expect(user1TasksAgain.some(task => task.title === 'Tarea del Usuario 2')).toBe(false);

        console.log('✅ Test de aislamiento de usuarios completado exitosamente');
    }, 60000);

    test('should handle task operations correctly for authenticated user', async () => {
        // Asegurar que hay un usuario autenticado
        const user = await AuthService.signIn('admin@dailyorganizer.com', '123456');
        expect(user).toBeDefined();

        // Crear una tarea
        const testTask: Task = {
            id: `test-${Date.now()}`,
            title: 'Tarea de Prueba',
            complexity: 'high',
            urgency: 'low',
            createdAt: new Date(),
            isCompleted: false
        };

        await taskService.addTask(testTask);
        
        // Verificar que se agregó
        let tasks = taskService.getTasks();
        expect(tasks.some(task => task.title === 'Tarea de Prueba')).toBe(true);

        // Completar la tarea
        const addedTask = tasks.find(task => task.title === 'Tarea de Prueba');
        expect(addedTask).toBeDefined();
        
        await taskService.toggleTaskComplete(addedTask!.id);
        
        // Verificar que se completó
        tasks = taskService.getTasks();
        const completedTask = tasks.find(task => task.id === addedTask!.id);
        expect(completedTask?.isCompleted).toBe(true);

        // Eliminar la tarea
        await taskService.removeTask(addedTask!.id);
        
        // Verificar que se eliminó
        tasks = taskService.getTasks();
        expect(tasks.some(task => task.id === addedTask!.id)).toBe(false);

        console.log('✅ Test de operaciones CRUD completado exitosamente');
    }, 30000);
});
