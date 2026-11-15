export function getDefaultTaskDueAt(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function formatTaskDueDate(dueAt: string): string {
  if (!dueAt) return "Sem prazo";
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return dueAt;

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return `Hoje, ${timeStr}`;
  if (diffDays === 1) return `Amanhã, ${timeStr}`;
  if (diffDays === -1) return `Ontem, ${timeStr}`;

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${timeStr}`;
}

export function getTaskExpirationTimestamp(task: {
  dueAt?: string;
  dueDate: string;
}): number {
  if (task.dueAt) {
    const parsed = new Date(task.dueAt).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const raw = (task.dueDate || "").trim();
  if (!raw || raw.toLowerCase() === "concluído") {
    return Number.MAX_SAFE_INTEGER;
  }

  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  const hours = timeMatch ? Number(timeMatch[1]) : 23;
  const minutes = timeMatch ? Number(timeMatch[2]) : 59;

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  const lower = raw.toLowerCase();
  if (lower.startsWith("hoje")) {
    return base.getTime();
  }
  if (lower.startsWith("amanhã") || lower.startsWith("amanha")) {
    base.setDate(base.getDate() + 1);
    return base.getTime();
  }
  if (lower.startsWith("ontem")) {
    base.setDate(base.getDate() - 1);
    return base.getTime();
  }

  const dateMatch = raw.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]) - 1;
    let year = dateMatch[3] ? Number(dateMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    return new Date(year, month, day, hours, minutes, 0, 0).getTime();
  }

  return Number.MAX_SAFE_INTEGER - 1;
}

export function sortTasksByExpiration<
  T extends { completed: boolean; dueAt?: string; dueDate: string }
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return getTaskExpirationTimestamp(a) - getTaskExpirationTimestamp(b);
  });
}

export function isTaskOverdue(task: {
  completed: boolean;
  dueAt?: string;
  dueDate: string;
}): boolean {
  if (task.completed) return false;
  const ts = getTaskExpirationTimestamp(task);
  if (ts >= Number.MAX_SAFE_INTEGER - 1) return false;
  return ts < Date.now();
}
