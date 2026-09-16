import { Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import type {
  AppNotification,
  AppUser,
  Task,
  TaskComment,
  UserRole,
} from "../types";

export const DEMO_TEACHER_UID = "demo-teacher-uid";
export const DEMO_ADMIN_UID = "demo-admin-uid";

export function isDemoUid(uid: string | undefined | null): boolean {
  return !!uid && uid.startsWith("demo-");
}

export function makeDemoUser(role: UserRole): {
  user: User;
  appUser: AppUser;
} {
  const uid = role === "admin" ? DEMO_ADMIN_UID : DEMO_TEACHER_UID;
  const name = role === "admin" ? "Demo Admin" : "Demo Teacher";
  const user = {
    uid,
    email: `${role}@demo.local`,
    displayName: name,
  } as unknown as User;
  const appUser: AppUser = {
    uid,
    role,
    name,
    email: `${role}@demo.local`,
    employeeId: role === "admin" ? "ADMIN001" : "TCH001",
    department: role === "admin" ? "Administration" : "Mathematics",
    isClassTeacher: role === "teacher",
    createdAt: Timestamp.now(),
  };
  return { user, appUser };
}

const hoursFromNow = (h: number) => Timestamp.fromDate(new Date(Date.now() + h * 3600 * 1000));
const hoursAgo = (h: number) => Timestamp.fromDate(new Date(Date.now() - h * 3600 * 1000));

// ---------------- In-memory mock store (demo only, no network) ----------------

let demoTasks: Task[] = [
  {
    id: "demo-task-1",
    title: "Prepare Grade 10 Maths unit test",
    description: "Set a 50-mark question paper covering quadratic equations and trigonometry with answer key.",
    priority: "urgent",
    category: "exam",
    deadline: hoursFromNow(5),
    deadlineLabel: "today",
    status: "accepted",
    assignment: { type: "individual", teacherId: DEMO_TEACHER_UID },
    assignedTo: [DEMO_TEACHER_UID],
    assignedBy: DEMO_ADMIN_UID,
    assignedByName: "Demo Admin",
    createdAt: hoursAgo(26),
    acceptedAt: hoursAgo(20),
  },
  {
    id: "demo-task-2",
    title: "Submit monthly attendance register",
    description: "Compile August attendance for Class 8-B and submit the signed register to the office.",
    priority: "high",
    category: "documentation",
    deadline: hoursFromNow(28),
    deadlineLabel: "tomorrow",
    status: "pending",
    assignment: { type: "individual", teacherId: DEMO_TEACHER_UID },
    assignedTo: [DEMO_TEACHER_UID],
    assignedBy: DEMO_ADMIN_UID,
    assignedByName: "Demo Admin",
    createdAt: hoursAgo(50),
  },
  {
    id: "demo-task-3",
    title: "Parent-teacher meeting notes",
    description: "Share the minutes of the Grade 9 PTM held last Saturday with all class teachers.",
    priority: "medium",
    category: "meeting",
    deadline: hoursFromNow(72),
    deadlineLabel: "custom",
    status: "completed",
    assignment: { type: "individual", teacherId: DEMO_TEACHER_UID },
    assignedTo: [DEMO_TEACHER_UID],
    assignedBy: DEMO_ADMIN_UID,
    assignedByName: "Demo Admin",
    createdAt: hoursAgo(100),
    acceptedAt: hoursAgo(90),
    completedAt: hoursAgo(30),
    completionNote: "Minutes shared on the staff group.",
  },
  {
    id: "demo-task-4",
    title: "Science exhibition setup - Grade 7",
    description: "Coordinate with the science department for working models and display tables.",
    priority: "medium",
    category: "academic",
    deadline: hoursFromNow(96),
    deadlineLabel: "custom",
    status: "pending",
    assignment: { type: "department", department: "Science" },
    assignedTo: ["demo-teacher-rahul", DEMO_TEACHER_UID],
    assignedBy: DEMO_ADMIN_UID,
    assignedByName: "Demo Admin",
    createdAt: hoursAgo(10),
  },
  {
    id: "demo-task-5",
    title: "Correct Grade 8 homework books",
    description: "Finish correction of algebra homework for sections A and B.",
    priority: "low",
    category: "homework",
    deadline: hoursAgo(6),
    deadlineLabel: "today",
    status: "pending",
    assignment: { type: "individual", teacherId: DEMO_TEACHER_UID },
    assignedTo: [DEMO_TEACHER_UID],
    assignedBy: DEMO_ADMIN_UID,
    assignedByName: "Demo Admin",
    createdAt: hoursAgo(60),
  },
  {
    id: "demo-task-6",
    title: "Inter-school quiz team selection",
    description: "Conduct a written round and shortlist 4 students for the district quiz competition.",
    priority: "high",
    category: "student_related",
    deadline: hoursFromNow(50),
    deadlineLabel: "custom",
    status: "accepted",
    assignment: { type: "individual", teacherId: "demo-teacher-anitha" },
    assignedTo: ["demo-teacher-anitha"],
    assignedBy: DEMO_ADMIN_UID,
    assignedByName: "Demo Admin",
    createdAt: hoursAgo(30),
    acceptedAt: hoursAgo(25),
  },
];

let demoComments: TaskComment[] = [
  {
    id: "demo-comment-1",
    taskId: "demo-task-1",
    userId: DEMO_ADMIN_UID,
    userName: "Demo Admin",
    text: "Please include one case-study question as per the new pattern.",
    createdAt: hoursAgo(18),
  },
  {
    id: "demo-comment-2",
    taskId: "demo-task-1",
    userId: DEMO_TEACHER_UID,
    userName: "Demo Teacher",
    text: "Noted, will add it and share the draft by evening.",
    createdAt: hoursAgo(12),
  },
];

let demoNotifications: AppNotification[] = [
  {
    id: "demo-notif-1",
    uid: DEMO_TEACHER_UID,
    title: "New task assigned",
    body: "Prepare Grade 10 Maths unit test is due today.",
    type: "new_task",
    taskId: "demo-task-1",
    read: false,
    createdAt: hoursAgo(26),
  },
  {
    id: "demo-notif-2",
    uid: DEMO_TEACHER_UID,
    title: "Deadline approaching",
    body: "Correct Grade 8 homework books is overdue.",
    type: "deadline_approaching",
    taskId: "demo-task-5",
    read: false,
    createdAt: hoursAgo(8),
  },
  {
    id: "demo-notif-3",
    uid: DEMO_TEACHER_UID,
    title: "Task updated",
    body: "Parent-teacher meeting notes was marked completed.",
    type: "task_updated",
    taskId: "demo-task-3",
    read: true,
    createdAt: hoursAgo(30),
  },
  {
    id: "demo-notif-4",
    uid: DEMO_ADMIN_UID,
    title: "Task completed",
    body: "Demo Teacher completed Parent-teacher meeting notes.",
    type: "task_updated",
    taskId: "demo-task-3",
    read: false,
    createdAt: hoursAgo(29),
  },
];

const demoTeachers: AppUser[] = [
  {
    uid: DEMO_TEACHER_UID,
    role: "teacher",
    name: "Demo Teacher",
    email: "teacher@demo.local",
    employeeId: "TCH001",
    department: "Mathematics",
    isClassTeacher: true,
    createdAt: Timestamp.now(),
  },
  {
    uid: "demo-teacher-rahul",
    role: "teacher",
    name: "Rahul Verma",
    email: "rahul@demo.local",
    employeeId: "TCH002",
    department: "Science",
    isClassTeacher: false,
    createdAt: Timestamp.now(),
  },
  {
    uid: "demo-teacher-anitha",
    role: "teacher",
    name: "Anitha Rao",
    email: "anitha@demo.local",
    employeeId: "TCH003",
    department: "English",
    isClassTeacher: true,
    createdAt: Timestamp.now(),
  },
];

export function getDemoTasks(): Task[] {
  return demoTasks;
}

export function getDemoTasksForTeacher(teacherId: string): Task[] {
  return demoTasks.filter((t) => t.assignedTo.includes(teacherId));
}

export function getDemoTaskById(taskId: string): Task | null {
  return demoTasks.find((t) => t.id === taskId) ?? null;
}

export function addDemoTask(task: Task): void {
  demoTasks = [task, ...demoTasks];
}

export function updateDemoTaskStatus(
  taskId: string,
  status: Task["status"],
  completionNote?: string
): void {
  demoTasks = demoTasks.map((t) => {
    if (t.id !== taskId) return t;
    const updated: Task = { ...t, status };
    if (status === "accepted") updated.acceptedAt = Timestamp.now();
    if (status === "completed") {
      updated.completedAt = Timestamp.now();
      if (completionNote) updated.completionNote = completionNote;
    }
    return updated;
  });
}

export function getDemoComments(taskId: string): TaskComment[] {
  return demoComments.filter((c) => c.taskId === taskId);
}

export function addDemoComment(comment: TaskComment): void {
  demoComments = [...demoComments, comment];
}

export function getDemoNotifications(uid: string): AppNotification[] {
  return demoNotifications.filter((n) => n.uid === uid);
}

export function addDemoNotification(notif: AppNotification): void {
  demoNotifications = [notif, ...demoNotifications];
}

export function markDemoNotificationRead(notifId: string): void {
  demoNotifications = demoNotifications.map((n) =>
    n.id === notifId ? { ...n, read: true } : n
  );
}

export function markAllDemoNotificationsRead(uid: string): void {
  demoNotifications = demoNotifications.map((n) =>
    n.uid === uid ? { ...n, read: true } : n
  );
}

export function getDemoTeachers(): AppUser[] {
  return demoTeachers;
}
