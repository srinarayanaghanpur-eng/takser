import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Usage:
//   $env:FIREBASE_SERVICE_ACCOUNT = Get-Content service-account.json -Raw
//   node scripts/seed-user.mjs <employeeId> <password> <name> <role> [department]
// Example:
//   node scripts/seed-user.mjs admin Admin@123 "Principal" admin Administration
//   node scripts/seed-user.mjs tch001 Teach@123 "Priya Sharma" teacher Mathematics

const [employeeIdRaw, password, name, role = "teacher", department = "General"] =
  process.argv.slice(2);

if (!employeeIdRaw || !password || !name) {
  console.error(
    "Usage: node scripts/seed-user.mjs <employeeId> <password> <name> <role> [department]"
  );
  process.exit(1);
}
if (role !== "admin" && role !== "teacher") {
  console.error('Role must be "admin" or "teacher"');
  process.exit(1);
}

const employeeId = employeeIdRaw.toLowerCase();
const email = `${employeeId}@school.local`;

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT env var to your service account JSON first.");
  process.exit(1);
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

try {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log("Auth user already exists:", user.uid);
  } catch {
    user = await auth.createUser({ email, password, displayName: name });
    console.log("Auth user created:", user.uid);
  }

  await db.collection("users").doc(user.uid).set(
    {
      name,
      email,
      employeeId,
      role,
      department,
      isClassTeacher: false,
      createdAt: new Date(),
    },
    { merge: true }
  );
  console.log(`Firestore ${role} document written for UID:`, user.uid);
  console.log(`Login with employee ID: ${employeeId}`);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
