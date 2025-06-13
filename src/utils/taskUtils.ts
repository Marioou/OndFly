import { Task } from '../models/Task';

const complexityValues: Record<Task['complexity'], number> = {
    'low': 1,
    'medium': 2,
    'high': 3
};

const urgencyValues: Record<Task['urgency'], number> = {
    'low': 1,
    'medium': 2,
    'high': 3
};

export const sortTasksByComplexity = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => 
        complexityValues[a.complexity] - complexityValues[b.complexity]
    );
};

export const sortTasksByUrgency = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => 
        urgencyValues[a.urgency] - urgencyValues[b.urgency]
    );
};

export const filterTasksByComplexity = (tasks: Task[], complexity: Task['complexity']): Task[] => {
    return tasks.filter(task => task.complexity === complexity);
};

export const filterTasksByUrgency = (tasks: Task[], urgency: Task['urgency']): Task[] => {
    return tasks.filter(task => task.urgency === urgency);
};