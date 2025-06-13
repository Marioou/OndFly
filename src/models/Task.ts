export interface Task {
    id: string;
    title: string;
    complexity: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
    createdAt: Date;
    isCompleted: boolean;
}