import React, { useState } from 'react';
import { Task } from '../models/Task';

interface TaskFormProps {
    onAddTask: (task: Task) => Promise<void>;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title: title.trim(),
            complexity: 'medium',
            urgency: 'medium',
            createdAt: new Date(),
            isCompleted: false
        };

        await onAddTask(newTask);
        setTitle('');
    };

    return (
        <form onSubmit={handleSubmit} className="task-form">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Agrega una nueva tarea..."
                className="task-input"
            />
            <button type="submit" className="add-button">
                Agregar
            </button>
        </form>
    );
};

export default TaskForm;