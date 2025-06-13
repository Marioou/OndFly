import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../models/Task';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { filterTasksByUrgency, sortTasksByComplexity } from '../utils/taskUtils';
import { taskService, TaskWithSyncStatus } from '../services/TaskService';

const TaskList: React.FC = () => {
    // Detect mobile vs desktop
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeTab, setActiveTab] = useState<'low' | 'medium' | 'high'>('low');
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [tasks, setTasks] = useState<TaskWithSyncStatus[]>([]);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Inicializar el servicio de tareas
        taskService.initialize();
        
        // Marca inicio de carga hasta primer snapshot
        setInitialLoading(true);
        // Suscribirse a cambios en las tareas
        const unsubscribe = taskService.onTasksChange((updatedTasks) => {
            setTasks(updatedTasks);
            // Desactivar loader tras primer actualización
            setInitialLoading(false);
        });

        return () => {
            unsubscribe();
            taskService.destroy();
        };
    }, []);

    if (initialLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
            </div>
        );
    }
     
    const handleAddTask = async (newTask: Task) => {
        setLoading(true);
        setError(null);
        try {
            await taskService.addTask(newTask);
        } catch (err) {
            setError('Failed to add task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateComplexity = async (id: string, complexity: Task['complexity']) => {
        setLoading(true);
        setError(null);
        try {
            const task = tasks.find(t => t.id === id);
            if (task) {
                await taskService.updateTask({ ...task, complexity });
            }
        } catch (err) {
            setError('Failed to update task complexity. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUrgency = async (id: string, urgency: Task['urgency']) => {
        setLoading(true);
        setError(null);
        try {
            const task = tasks.find(t => t.id === id);
            if (task) {
                await taskService.updateTask({ ...task, urgency });
            }
        } catch (err) {
            setError('Failed to update task urgency. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await taskService.toggleTaskComplete(id);
        } catch (err) {
            setError('Failed to toggle task completion. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await taskService.removeTask(id);
        } catch (err) {
            setError('Failed to delete task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const activeTasks = tasks.filter(task => !task.isCompleted);
    const completedTasks = tasks.filter(task => task.isCompleted);

    // Filtrar por urgencia y ordenar por complejidad (más compleja arriba)
    const lowUrgencyTasks = sortTasksByComplexity(filterTasksByUrgency(activeTasks, 'low')).reverse();
    const mediumUrgencyTasks = sortTasksByComplexity(filterTasksByUrgency(activeTasks, 'medium')).reverse();
    const highUrgencyTasks = sortTasksByComplexity(filterTasksByUrgency(activeTasks, 'high')).reverse();

    const columnVariants = {
        hidden: { 
            opacity: 0,
            y: 20
        },
        visible: { 
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    return (
        <motion.div className="task-list" initial="hidden" animate="visible" variants={columnVariants}>
            {/* Mobile tabs for categories */}
            {isMobile && (
                <div className="mobile-tabs">
                    <button className={activeTab === 'low' ? 'active' : ''} onClick={() => setActiveTab('low')}>Por hacer</button>
                    <button className={activeTab === 'medium' ? 'active' : ''} onClick={() => setActiveTab('medium')}>Importante</button>
                    <button className={activeTab === 'high' ? 'active' : ''} onClick={() => setActiveTab('high')}>Urgente</button>
                </div>
            )}

            <TaskForm onAddTask={handleAddTask} />

            <motion.div className="tasks-controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <motion.button onClick={() => setShowCompleted(!showCompleted)} className="toggle-completed-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    {showCompleted ? 'Ocultar completadas' : 'Mostrar completadas'}
                </motion.button>
            </motion.div>

            {/* Render columns or mobile view */}
            {isMobile ? (
                <motion.div className="tasks-container" layout transition={{ duration: 0.2 }}>
                    <AnimatePresence mode="sync" initial={false}>
                        {(activeTab === 'low' ? lowUrgencyTasks : activeTab === 'medium' ? mediumUrgencyTasks : highUrgencyTasks).map(task => (
                            <TaskItem key={task.id} task={task} onUpdateComplexity={handleUpdateComplexity} onUpdateUrgency={handleUpdateUrgency} onToggleComplete={handleToggleComplete} onDelete={handleDeleteTask} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div className="tasks-columns" layout transition={{ duration: 0.2 }}>
                    <motion.div className="task-column" layout transition={{ duration: 0.2 }}>
                        <div className="column-header low">Por hacer</div>
                        <motion.div className="tasks-container" layout transition={{ duration: 0.2 }}>
                            <AnimatePresence mode="sync" initial={false}>
                                {lowUrgencyTasks.map((task, index) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onUpdateComplexity={handleUpdateComplexity}
                                        onUpdateUrgency={handleUpdateUrgency}
                                        onToggleComplete={handleToggleComplete}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>

                    <motion.div className="task-column" layout transition={{ duration: 0.2 }}>
                        <div className="column-header medium">Importante</div>
                        <motion.div className="tasks-container" layout transition={{ duration: 0.2 }}>
                            <AnimatePresence mode="sync" initial={false}>
                                {mediumUrgencyTasks.map((task, index) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onUpdateComplexity={handleUpdateComplexity}
                                        onUpdateUrgency={handleUpdateUrgency}
                                        onToggleComplete={handleToggleComplete}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>

                    <motion.div className="task-column" layout transition={{ duration: 0.2 }}>
                        <div className="column-header high">Urgente</div>
                        <motion.div className="tasks-container" layout transition={{ duration: 0.2 }}>
                            <AnimatePresence mode="sync" initial={false}>
                                {highUrgencyTasks.map((task, index) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onUpdateComplexity={handleUpdateComplexity}
                                        onUpdateUrgency={handleUpdateUrgency}
                                        onToggleComplete={handleToggleComplete}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {showCompleted && completedTasks.length > 0 && (
                    <motion.div 
                        className="completed-tasks-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                    >
                        <motion.h2 layout="position">Tareas Completadas</motion.h2>
                        <AnimatePresence mode="popLayout">
                            {completedTasks.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onUpdateComplexity={handleUpdateComplexity}
                                    onUpdateUrgency={handleUpdateUrgency}
                                    onToggleComplete={handleToggleComplete}
                                    onDelete={handleDeleteTask}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </motion.div>
    );
};

export default TaskList;