import React from 'react';
import { motion } from 'framer-motion';
import { Task } from '../models/Task';
import { TaskWithSyncStatus } from '../services/TaskService';

interface TaskItemProps {
    task: TaskWithSyncStatus;
    onUpdateComplexity: (id: string, complexity: Task['complexity']) => void;
    onUpdateUrgency: (id: string, urgency: Task['urgency']) => void;
    onToggleComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
    task,
    onUpdateComplexity,
    onUpdateUrgency,
    onToggleComplete,
    onDelete
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ 
                opacity: 0,
                y: 20,
                transition: { 
                    duration: 0.2,
                    ease: "easeInOut"
                }
            }}
            style={{ position: 'relative' }}
            className={`task-item ${task.isCompleted ? 'completed' : ''}`}
            data-sync-status={task.syncStatus || 'synced'}
            transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 40,
                mass: 1
            }}
        >
            <motion.div 
                className="task-header" 
                layout="preserve-aspect"
                transition={{ duration: 0.2 }}
            >
                <motion.input
                    whileTap={{ scale: 1.2 }}
                    transition={{ duration: 0.2 }}
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => onToggleComplete(task.id)}
                />
                <motion.h3 layout="position">
                    {task.title}
                    {task.syncStatus === 'error' && (
                        <span className="sync-error-tooltip" title="Error de sincronización - Se reintentará automáticamente">
                            ⚠️
                        </span>
                    )}
                </motion.h3>
                <motion.button
                    className="delete-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete(task.id)}
                >
                    Eliminar
                </motion.button>
            </motion.div>
            
            <motion.div 
                className="task-controls" 
                layout="preserve-aspect"
                transition={{ duration: 0.2 }}
            >
                <div className="control-group">
                    <label>Complejidad:</label>
                    <select
                        value={task.complexity}
                        onChange={(e) => onUpdateComplexity(task.id, e.target.value as Task['complexity'])}
                    >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                    </select>
                </div>
                
                <div className="control-group">
                    <label>Urgencia:</label>
                    <select
                        value={task.urgency}
                        onChange={(e) => onUpdateUrgency(task.id, e.target.value as Task['urgency'])}
                    >
                        <option value="low">Por hacer</option>
                        <option value="medium">Importante</option>
                        <option value="high">Urgente</option>
                    </select>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TaskItem;