import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "teacher";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskCategory =
  | "academic"
  | "homework"
  | "exam"
  | "meeting"
  | "documentation"
  | "student_related"
  | "other";

export type TaskStatus = "pending" | "accepted" | "completed" | "delayed";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export type TaskRecurrence = "none" | "daily" | "weekly";

export type TaskAssignment =
  | { type: "individual"; teacherId: string }
  | { type: "class_teacher" }
  | { type: "department"; department: string }
  | { type: "all" };

export interface AppUser {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  employeeId: string;
  department?: string;
  isClassTeacher?: boolean;
  photoURL?: string;
  fcmToken?: string;
  initialPassword?: string;
  disabled?: boolean;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  deadline: Timestamp;
  deadlineLabel: "today" | "tomorrow" | "custom";
  status: TaskStatus;
  assignment: TaskAssignment;
  assignedTo: string[];
  assignedBy: string;
  assignedByName: string;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  completedAt?: Timestamp;
  completionNote?: string;
  proofImageUrl?: string;
  proofDocUrl?: string;
  proofDocName?: string;
  seenBy?: string[];
  subtasks?: Subtask[];
  recurrence?: TaskRecurrence;
  reminderSent?: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: "image" | "pdf" | "document";
  uploadedAt: Timestamp;
}

export interface AppNotification {
  id: string;
  uid: string;
  title: string;
  body: string;
  type: "new_task" | "deadline_approaching" | "task_updated" | "reminder";
  taskId?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface TeacherStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  delayedTasks: number;
  avgCompletionHours: number;
  completionRate: number;
}

export interface DashboardData {
  todayTasks: number;
  completed: number;
  pending: number;
  urgent: number;
  recentTasks: Task[];
  stats: TeacherStats;
}
