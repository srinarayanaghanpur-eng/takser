export const APP_NAME = "Sri Narayana Teacher Tasks";
export const APP_VERSION = "1.0.0";

export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  TASKS: "tasks",
  TASK_COMMENTS: "taskComments",
  TASK_ATTACHMENTS: "taskAttachments",
  NOTIFICATIONS: "notifications",
  ANALYTICS: "analytics",
} as const;

export const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#22C55E", bg: "#DCFCE7" },
  medium: { label: "Medium", color: "#F59E0B", bg: "#FEF3C7" },
  high: { label: "High", color: "#F97316", bg: "#FFEDD5" },
  urgent: { label: "Urgent", color: "#EF4444", bg: "#FEE2E2" },
} as const;

export const CATEGORY_CONFIG = {
  academic: { label: "Academic", icon: "book" },
  homework: { label: "Homework", icon: "edit" },
  exam: { label: "Exam", icon: "clipboard" },
  meeting: { label: "Meeting", icon: "users" },
  documentation: { label: "Documentation", icon: "file" },
  student_related: { label: "Student Related", icon: "user" },
  other: { label: "Other", icon: "more" },
} as const;
