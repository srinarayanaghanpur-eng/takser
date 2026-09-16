import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!keyPath) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_PATH to your service account JSON file.");
  process.exit(1);
}
const sa = JSON.parse(readFileSync(keyPath, "utf8"));

initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

const uid = "y91J3mdPD8cVxpI7VWUNgmapiv63";
const user = await auth.getUser(uid);
console.log("Auth email:", user.email);

await db.collection("users").doc(uid).set(
  {
    name: "Principal",
    email: user.email,
    employeeId: "admin",
    role: "admin",
    department: "Administration",
    isClassTeacher: false,
    createdAt: new Date(),
  },
  { merge: true }
);
console.log("Admin doc written for", uid);
process.exit(0);
