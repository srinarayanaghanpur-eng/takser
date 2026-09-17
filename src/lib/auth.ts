import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser,
  getAuth,
  type User,
} from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";
import type { AppUser } from "../types";

export async function loginWithEmployeeId(
  employeeId: string,
  password: string
): Promise<{ user: User; appUser: AppUser }> {
  const email = `${employeeId.trim().toLowerCase()}@school.local`;
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const appUser = await fetchAppUser(userCredential.user.uid);
  return { user: userCredential.user, appUser };
}

export async function fetchAppUser(uid: string): Promise<AppUser> {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (!docSnap.exists()) throw new Error("User not found");
  const appUser = { uid, ...docSnap.data() } as AppUser;
  if (appUser.disabled) throw new Error("Account has been disabled");
  return appUser;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function createUser(
  uid: string,
  data: Omit<AppUser, "uid" | "createdAt">
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === "AdminSecondary");
  const app = existing ?? initializeApp(firebaseConfig, "AdminSecondary");
  return getAuth(app);
}

export interface NewTeacherInput {
  employeeId: string;
  password: string;
  name: string;
  department: string;
  isClassTeacher: boolean;
}

export async function createTeacherAccount(
  input: NewTeacherInput
): Promise<{ uid: string }> {
  const employeeId = input.employeeId.trim().toLowerCase();
  if (!employeeId) throw new Error("Employee ID is required");
  if (!input.password || input.password.length < 6)
    throw new Error("Password must be at least 6 characters");
  if (!input.name.trim()) throw new Error("Name is required");

  const email = `${employeeId}@school.local`;
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, input.password);
  const uid = cred.user.uid;
  try {
    await setDoc(doc(db, "users", uid), {
      name: input.name.trim(),
      email,
      employeeId,
      role: "teacher",
      department: input.department.trim() || "General",
      isClassTeacher: input.isClassTeacher,
      initialPassword: input.password,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    await deleteUser(cred.user).catch(() => {});
    throw e;
  } finally {
    await firebaseSignOut(secondaryAuth).catch(() => {});
  }
  return { uid };
}

export async function updateTeacherProfile(
  uid: string,
  data: { name: string; department: string; isClassTeacher: boolean }
): Promise<void> {  if (!data.name.trim()) throw new Error("Name is required");
  await updateDoc(doc(db, "users", uid), {
    name: data.name.trim(),
    department: data.department.trim() || "General",
    isClassTeacher: data.isClassTeacher,
  });
}

export async function updateUserPhoto(uid: string, photoURL: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { photoURL });
}

export async function resetTeacherPassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!newPassword || newPassword.length < 6)
    throw new Error("New password must be at least 6 characters");
  const secondaryAuth = getSecondaryAuth();
  const cred = await signInWithEmailAndPassword(secondaryAuth, email, currentPassword);
  try {
    await updatePassword(cred.user, newPassword);
    await updateDoc(doc(db, "users", cred.user.uid), { initialPassword: newPassword });
  } finally {
    await firebaseSignOut(secondaryAuth).catch(() => {});
  }
}

export async function deleteTeacherAccount(uid: string): Promise<void> {
  // Soft-disable: blocks login immediately, preserves task history.
  // (Auth accounts can't be deleted from client SDKs.)
  await updateDoc(doc(db, "users", uid), { disabled: true });
}
