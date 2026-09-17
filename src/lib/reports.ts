import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { AppUser, Task } from "../types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface TeacherReportRow {
  teacher: AppUser;
  total: number;
  completed: number;
  pending: number;
  rate: number;
}

export function buildTeacherRows(teachers: AppUser[], tasks: Task[]): TeacherReportRow[] {
  return teachers
    .map((teacher) => {
      const mine = tasks.filter((t) => t.assignedTo.includes(teacher.uid));
      const completed = mine.filter((t) => t.status === "completed").length;
      const pending = mine.filter((t) => t.status === "pending" || t.status === "accepted").length;
      return {
        teacher,
        total: mine.length,
        completed,
        pending,
        rate: mine.length > 0 ? Math.round((completed / mine.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.completed - a.completed);
}

export async function exportPerformancePdf(
  teachers: AppUser[],
  tasks: Task[]
): Promise<void> {
  const rows = buildTeacherRows(teachers, tasks);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const date = new Date().toLocaleString();

  const rowsHtml = rows
    .map(
      (r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(r.teacher.name)}<br/><small>${esc(r.teacher.employeeId)} · ${esc(r.teacher.department ?? "")}</small></td>
        <td>${r.total}</td>
        <td>${r.completed}</td>
        <td>${r.pending}</td>
        <td><b>${r.rate}%</b></td>
      </tr>`
    )
    .join("");

  const taskRowsHtml = tasks
    .slice(0, 100)
    .map(
      (t, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(t.title)}</td>
        <td>${esc(t.priority)}</td>
        <td>${esc(t.status)}</td>
        <td>${t.deadline?.toDate?.()?.toLocaleString() ?? ""}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; }
      h1 { font-size: 22px; margin-bottom: 2px; }
      .sub { color: #64748B; font-size: 12px; margin-bottom: 16px; }
      .stats { display: flex; gap: 12px; margin-bottom: 20px; }
      .stat { border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; }
      .stat b { font-size: 20px; }
      h2 { font-size: 16px; margin: 20px 0 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #E2E8F0; padding: 6px 8px; text-align: left; }
      th { background: #1A3A6B; color: #fff; }
      small { color: #64748B; }
    </style></head><body>
    <h1>Sri Narayana Teacher Tasks — Performance Report</h1>
    <div class="sub">Generated ${esc(date)}</div>
    <div class="stats">
      <div class="stat"><b>${total}</b><br/>Total tasks</div>
      <div class="stat"><b>${completed}</b><br/>Completed</div>
      <div class="stat"><b>${total - completed}</b><br/>Open</div>
      <div class="stat"><b>${teachers.length}</b><br/>Teachers</div>
    </div>
    <h2>Teacher Performance</h2>
    <table><tr><th>#</th><th>Teacher</th><th>Total</th><th>Done</th><th>Pending</th><th>Rate</th></tr>${rowsHtml}</table>
    <h2>Tasks (latest ${Math.min(tasks.length, 100)})</h2>
    <table><tr><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Deadline</th></tr>${taskRowsHtml}</table>
    </body></html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (Platform.OS === "web") {
    const link = document.createElement("a");
    link.href = uri;
    link.download = "teacher-performance-report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share performance report",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}
