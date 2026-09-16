import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
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
  return { uid, ...docSnap.data() } as AppUser;
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
