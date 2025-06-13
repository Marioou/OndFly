import { Task } from '../models/Task';

export const compressTask = (task: Task): any => {
    // Comprimir campos para reducir tamaño de datos
    return {
        i: task.id,
        t: task.title,
        c: task.complexity[0], // 'l', 'm', 'h'
        u: task.urgency[0], // 'l', 'm', 'h'
        d: task.createdAt.getTime(),
        f: task.isCompleted ? 1 : 0
    };
};

export const decompressTask = (compressed: any): Task => {
    const complexityMap: { [key: string]: Task['complexity'] } = {
        l: 'low',
        m: 'medium',
        h: 'high'
    };

    return {
        id: compressed.i,
        title: compressed.t,
        complexity: complexityMap[compressed.c],
        urgency: complexityMap[compressed.u],
        createdAt: new Date(compressed.d),
        isCompleted: compressed.f === 1
    };
};
