import { sortTasksByComplexity, sortTasksByUrgency } from '../../src/utils/taskUtils';
import { Task } from '../../src/models/Task';

describe('Task Utility Functions', () => {
    const tasks: Task[] = [
        { id: '1', title: 'Task 1', complexity: 'medium', urgency: 'low', createdAt: new Date(), isCompleted: false },
        { id: '2', title: 'Task 2', complexity: 'low', urgency: 'high', createdAt: new Date(), isCompleted: false },
        { id: '3', title: 'Task 3', complexity: 'high', urgency: 'medium', createdAt: new Date(), isCompleted: false },
    ];

    test('sortTasksByComplexity should sort tasks by complexity', () => {
        const sortedTasks = sortTasksByComplexity(tasks);
        expect(sortedTasks).toEqual([
            { id: '2', title: 'Task 2', complexity: 'low', urgency: 'high', createdAt: expect.any(Date), isCompleted: false },
            { id: '1', title: 'Task 1', complexity: 'medium', urgency: 'low', createdAt: expect.any(Date), isCompleted: false },
            { id: '3', title: 'Task 3', complexity: 'high', urgency: 'medium', createdAt: expect.any(Date), isCompleted: false },
        ]);
    });

    test('sortTasksByUrgency should sort tasks by urgency', () => {
        const sortedTasks = sortTasksByUrgency(tasks);
        expect(sortedTasks).toEqual([
            { id: '1', title: 'Task 1', complexity: 'medium', urgency: 'low', createdAt: expect.any(Date), isCompleted: false },
            { id: '3', title: 'Task 3', complexity: 'high', urgency: 'medium', createdAt: expect.any(Date), isCompleted: false },
            { id: '2', title: 'Task 2', complexity: 'low', urgency: 'high', createdAt: expect.any(Date), isCompleted: false },
        ]);
    });
});