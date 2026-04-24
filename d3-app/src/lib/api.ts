export const API_BASE_URL = "http://localhost:5000/api";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT";

const getToken = () => localStorage.getItem("token");

const redirectToAuth = () => {
  window.location.href = "/";
};

const request = async <TResponse>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  options?: { requireAuth?: boolean }
): Promise<TResponse> => {
  const requireAuth = options?.requireAuth ?? true;
  const token = getToken();

  if (requireAuth && !token) {
    redirectToAuth();
    throw new AuthError("No token found");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401 && requireAuth) {
    localStorage.removeItem("token");
    redirectToAuth();
    throw new AuthError("Token invalid or expired");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { message?: string }).message || `Request failed: ${response.status}`);
  }

  return data as TResponse;
};

export const api = {
  get: <TResponse>(path: string, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "GET", undefined, options),
  post: <TResponse>(path: string, body?: unknown, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "POST", body, options),
  patch: <TResponse>(path: string, body?: unknown, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "PATCH", body, options),
  put: <TResponse>(path: string, body?: unknown, options?: { requireAuth?: boolean }) =>
    request<TResponse>(path, "PUT", body, options),
};

export type ScoreOverview = {
  currentScore: number;
  level: string;
  levelEmoji: string;
  levelColor: string;
  streak: number;
  longestStreak: number;
  weeklyAvgScore: number;
};

export type ScoreHistoryEntry = {
  date: string;
  score: number;
  delta: number;
  reason: string;
};

export type ScoreStreak = {
  streakDays: number;
  longestStreakDays: number;
  lastStreakDate: string | null;
};

export const scoreApi = {
  getOverview: () => api.get<ScoreOverview>("/v1/score"),
  getHistory: (days = 30) => api.get<{ history: ScoreHistoryEntry[] }>(`/v1/score/history?days=${days}`),
  getStreak: () => api.get<ScoreStreak>("/v1/score/streak"),
  recalculate: (date?: string) => api.post("/v1/score/recalculate", date ? { date } : {}),
};

export type InterventionTask = {
  type: string;
  icon: string;
  title: string;
  description: string;
  durationSeconds: number;
  category: string;
  steps?: string[];
};

export type InterventionPayload = {
  interventionId: string;
  mode: "gentle" | "pause" | "lock";
  action: "SHOW_REMINDER" | "SHOW_TASK" | "FORCE_FOCUS";
  task: InterventionTask;
  message: string;
  pomodoroMinutes: number;
};

export type InterventionDoc = {
  _id: string;
  mode: "gentle" | "pause" | "lock";
  triggerApp: string;
  taskType: string;
  taskAssigned?: string;
  status: "pending" | "completed" | "skipped";
  triggeredAt: string;
};

export const interventionApi = {
  trigger: (body: { appName: string; continuousMinutes: number; sessionLogId?: string }) =>
    api.post<InterventionPayload>("/v1/interventions/trigger", body),
  complete: (id: string) => api.patch<{ success: boolean; scoreUpdate?: unknown }>(`/v1/interventions/${id}/complete`, {}),
  skip: (id: string) => api.patch<{ success: boolean }>(`/v1/interventions/${id}/skip`, {}),
  pending: () => api.get<{ intervention: InterventionDoc | null }>("/v1/interventions/pending"),
  history: (page = 1, limit = 20) =>
    api.get<{ interventions: InterventionDoc[]; total: number; page: number; totalPages: number }>(
      `/v1/interventions/history?page=${page}&limit=${limit}`
    ),
};

export type MirrorAnalysis = {
  coreTrigger: {
    label: string;
    headline: string;
    body: string;
    icon: string;
    severity: string;
  };
  patterns: Array<{
    icon: string;
    title: string;
    body: string;
    stat: string;
    statLabel: string;
    type: "warning" | "positive";
  }>;
  prescription: {
    headline: string;
    items: Array<{ icon: string; text: string }>;
  };
  closingLine: string;
  meta?: {
    avgDailyMinutes: number;
    goalMetRate: number;
    hoursReclaimed: number;
    scoreImprovement: number;
    moodTrend: string;
    topApps: Array<{ appName: string; totalMinutes: number }>;
    dataPoints: { journals: number; days: number; interventions: number };
  };
};

export const mirrorApi = {
  getAnalysis: () => api.get<{ success: boolean; data: MirrorAnalysis }>("/v1/mirror/analysis"),
  refreshAnalysis: () => api.get<{ success: boolean; data: MirrorAnalysis }>("/v1/mirror/analysis/refresh"),
};

