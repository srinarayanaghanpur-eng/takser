import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types";
import {
  getTasksForTeacher,
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  addTaskComment,
} from "../lib/firestore";

export function useTeacherTasks(teacherId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTasksForTeacher(teacherId);
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (taskId: string, status: Task["status"], note?: string) => {
      await updateTaskStatus(taskId, status, note);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status, ...(note ? { completionNote: note } : {}) }
            : t
        )
      );
    },
    []
  );

  return { tasks, loading, error, refresh, updateStatus };
}

export function useAdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTasks();
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, loading, error, refresh };
}

export function useTaskDetail(taskId: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTaskById(taskId);
      setTask(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { task, loading, error, refresh };
}
