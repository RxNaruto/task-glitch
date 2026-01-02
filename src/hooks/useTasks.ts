import { useCallback, useEffect, useMemo, useState } from 'react';
import { DerivedTask, Metrics, Task, TaskInput } from '@/types';
import {
  computeAverageROI,
  computePerformanceGrade,
  computeRevenuePerHour,
  computeTimeEfficiency,
  computeTotalRevenue,
  withDerived,
  sortTasks as sortDerived,
} from '@/utils/logic';
import { generateSalesTasks } from '@/utils/seed';

interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  derivedSorted: DerivedTask[];
  metrics: Metrics;
  lastDeleted: Task | null;
  addTask: (task: TaskInput & { id?: string }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  clearLastDelete: () => void;
}

const INITIAL_METRICS: Metrics = {
  totalRevenue: 0,
  totalTimeTaken: 0,
  timeEfficiencyPct: 0,
  revenuePerHour: 0,
  averageROI: 0,
  performanceGrade: 'Needs Improvement',
};

export function useTasks(): UseTasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/tasks.json');
        const data = res.ok ? await res.json() : [];
        const base = Array.isArray(data) && data.length > 0 ? data : generateSalesTasks(50);

        const safe = base.filter(
          (t: any) =>
            typeof t.id === 'string' &&
            typeof t.title === 'string' &&
            typeof t.revenue === 'number' &&
            Number.isFinite(t.revenue) &&
            typeof t.timeTaken === 'number' &&
            t.timeTaken > 0
        );

        setTasks(safe);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const derivedSorted = useMemo(() => {
    return sortDerived(tasks.map(withDerived));
  }, [tasks]);

  const metrics = useMemo(() => {
    if (tasks.length === 0) return INITIAL_METRICS;
    const avgROI = computeAverageROI(tasks);
    return {
      totalRevenue: computeTotalRevenue(tasks),
      totalTimeTaken: tasks.reduce((s, t) => s + t.timeTaken, 0),
      timeEfficiencyPct: computeTimeEfficiency(tasks),
      revenuePerHour: computeRevenuePerHour(tasks),
      averageROI: avgROI,
      performanceGrade: computePerformanceGrade(avgROI),
    };
  }, [tasks]);

  const addTask = useCallback((task: TaskInput & { id?: string }) => {
    setTasks(prev => {
      const id = task.id ?? crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const completedAt = task.status === 'Done' ? createdAt : undefined;
      return [...prev, { ...task, id, createdAt, completedAt }];
    });
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...patch };
        if (t.status !== 'Done' && updated.status === 'Done' && !updated.completedAt) {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const found = prev.find(t => t.id === id) ?? null;
      setLastDeleted(found);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    if (!lastDeleted) return;
    setTasks(prev => [...prev, lastDeleted]);
    setLastDeleted(null);
  }, [lastDeleted]);

  const clearLastDelete = useCallback(() => {
    setLastDeleted(null);
  }, []);

  return {
    tasks,
    loading,
    error,
    derivedSorted,
    metrics,
    lastDeleted,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
    clearLastDelete,
  };
}
