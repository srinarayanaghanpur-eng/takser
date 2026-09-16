import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const uid = "LSwDSgzt6NO0eNkOGFSbGmKH7VD3";
const employeeId = "admin";
const password = "Admin@123";
const email = `${employeeId}@school.local`;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

try {
  let user;
  try {
    user = await auth.getUser(uid);
    console.log("Auth user already exists");
  } catch {
    user = await auth.createUser({
      uid,
      email,
      password,
      displayName: "Admin",
    });
    console.log("Auth user created:", user.uid);
  }

  const userDoc = {
    name: "Admin",
    email,
    employeeId,
    role: "admin",
    department: "administration",
    isClassTeacher: false,
    createdAt: new Date(),
  };

  await db.collection("users").doc(user.uid).set(userDoc, { merge: true });
  console.log("Firestore admin document created for UID:", user.uid);
  console.log("Login with employee ID: admin");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
