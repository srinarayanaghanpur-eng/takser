import type { Task } from "../types";

export function isOverdue(task: Task, now: number = Date.now()): boolean {
  if (task.status === "completed") return false;
  const ms = task.deadline?.toDate?.()?.getTime?.() ?? 0;
  return ms > 0 && ms < now;
}

export function matchesStatusFilter(task: Task, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "delayed") return isOverdue(task);
  return task.status === filter;
}
