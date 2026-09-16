import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  documentId,
  type Timestamp as FirestoreTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/config";
import type {
  AppUser,
  Task,
  TaskComment,
  AppNotification,
  TaskAttachment,
  TeacherStats,
} from "../types";

export async function getAllTeachers(): Promise<AppUser[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.USERS),
    where("role", "==", "teacher"),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

export async function getTasksForTeacher(
  teacherId: string
): Promise<Task[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.TASKS),
    where("assignedTo", "array-contains", teacherId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function getAllTasks(): Promise<Task[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.TASKS),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.TASKS, taskId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Task;
}

export async function createTask(data: Omit<Task, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.TASKS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTaskStatus(
  taskId: string,
  status: Task["status"],
  completionNote?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status };
  if (status === "accepted") updateData.acceptedAt = serverTimestamp();
  if (status === "completed") {
    updateData.completedAt = serverTimestamp();
    if (completionNote) updateData.completionNote = completionNote;
  }
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.TASKS, taskId), updateData);
}

export async function addTaskComment(
  taskId: string,
  userId: string,
  userName: string,
  text: string
): Promise<string> {
  const docRef = await addDoc(
    collection(db, FIRESTORE_COLLECTIONS.TASK_COMMENTS),
    { taskId, userId, userName, text, createdAt: serverTimestamp() }
  );
  return docRef.id;
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.TASK_COMMENTS),
    where("taskId", "==", taskId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskComment));
}

export async function getNotificationsForUser(
  uid: string
): Promise<AppNotification[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function markNotificationRead(
  notifId: string
): Promise<void> {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, notifId), {
    read: true,
  });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
    where("uid", "==", uid),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const updates = snap.docs.map((d) =>
    updateDoc(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, d.id), { read: true })
  );
  await Promise.all(updates);
}

export async function createNotification(
  data: Omit<AppNotification, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUsersByIds(uids: string[]): Promise<AppUser[]> {
  if (uids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
  const results: AppUser[] = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.USERS),
      where(documentId(), "in", chunk)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => results.push({ uid: d.id, ...d.data() } as AppUser));
  }
  return results;
}

export async function updateUserPushToken(uid: string, pushToken: string): Promise<void> {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, uid), { fcmToken: pushToken });
}

export async function getTeacherStats(teacherId: string): Promise<TeacherStats> {
  const tasks = await getTasksForTeacher(teacherId);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "accepted").length;
  const delayed = tasks.filter((t) => t.status === "delayed").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completedTasks = tasks.filter((t) => t.completedAt && t.createdAt);
  const avgHours =
    completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((sum, t) => {
            const created = (t.createdAt as FirestoreTimestamp).toMillis();
            const completedAt = (t.completedAt as FirestoreTimestamp).toMillis();
            return sum + (completedAt - created) / (1000 * 60 * 60);
          }, 0) / completedTasks.length
        )
      : 0;

  return { totalTasks: total, completedTasks: completed, pendingTasks: pending, delayedTasks: delayed, avgCompletionHours: avgHours, completionRate };
}
