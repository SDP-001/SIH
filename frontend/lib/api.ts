export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export interface UserSession {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
  institution_id?: string | null;
  institution_name?: string | null;
}

export const DEMO_CREDENTIALS: Record<string, string> = {
  "aicte.admin@aicte.gov.in": "Aicte@12345",
  "superadmin@aicte.gov.in": "Admin@12345",
  "principal@dits.ac.in": "Inst@12345",
  "dean@mcer.edu.in": "Inst@12345",
  "cse.hod@dits.ac.in": "Coord@12345",
  "operator@dits.ac.in": "Operator@12345",
  "rahul.sharma@student.dits.ac.in": "Student@12345",
  "verifier@tcs-background.com": "Verifier@12345",
};

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    // Check if expired or within 10 seconds of expiry
    return payload.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("apaar_token");
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearStoredSession();
    return null;
  }
  return token;
};

export const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("apaar_token", token);
  }
};

export const clearStoredSession = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("apaar_token");
    localStorage.removeItem("apaar_user");
  }
};

export const getStoredUser = (): UserSession | null => {
  if (typeof window === "undefined") return null;
  const token = getStoredToken();
  if (!token) return null;
  const raw = localStorage.getItem("apaar_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserSession): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("apaar_user", JSON.stringify(user));
  }
};

interface FetchOptions extends RequestInit {
  _isRetry?: boolean;
}

let refreshPromise: Promise<UserSession | null> | null = null;

async function attemptAutoRelogin(): Promise<UserSession | null> {
  if (typeof window === "undefined") return null;
  const rawUser = localStorage.getItem("apaar_user");
  let email = "aicte.admin@aicte.gov.in";
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.email) email = parsed.email;
    } catch {
      // ignore
    }
  }
  const password = DEMO_CREDENTIALS[email] || "Aicte@12345";
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const session: UserSession = await res.json();
      setStoredToken(session.access_token);
      setStoredUser(session);
      window.dispatchEvent(new CustomEvent("session-refreshed", { detail: session }));
      return session;
    }
  } catch {
    // login failed
  }
  clearStoredSession();
  window.dispatchEvent(new CustomEvent("session-expired"));
  return null;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const isAuthEndpoint = endpoint.startsWith("/auth/login");
  let token = !isAuthEndpoint ? getStoredToken() : null;

  if (!token && !isAuthEndpoint && typeof window !== "undefined") {
    if (!refreshPromise) {
      refreshPromise = attemptAutoRelogin().finally(() => {
        refreshPromise = null;
      });
    }
    const freshSession = await refreshPromise;
    if (freshSession) {
      token = freshSession.access_token;
    }
  }

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err?.name === "TypeError" && (err?.message?.includes("fetch") || err?.message?.includes("Failed to fetch"))) {
      throw new Error(`Cannot connect to backend API at ${API_BASE_URL}. Ensure the backend server is running.`);
    }
    throw err;
  }

  if (!res.ok) {
    let errorDetail = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore non-json error
    }

    const isAuthFailure = res.status === 401 || (res.status === 404 && String(errorDetail).includes("User not found"));
    if (isAuthFailure && !options._isRetry && !isAuthEndpoint && typeof window !== "undefined") {
      clearStoredSession();
      if (!refreshPromise) {
        refreshPromise = attemptAutoRelogin().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        return apiFetch<T>(endpoint, { ...options, _isRetry: true });
      }
    }

    throw new Error(errorDetail);
  }

  return res.json();
}


export const api = {
  // Auth
  async login(email: string, password: string): Promise<UserSession> {
    const res = await apiFetch<UserSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.access_token);
    setStoredUser(res);
    return res;
  },

  async seedDemo(): Promise<{ status: string; message: string }> {
    return apiFetch<{ status: string; message: string }>("/auth/seed-demo", {
      method: "POST",
    });
  },

  async getHealth(): Promise<any> {
    return apiFetch<any>("/health");
  },

  // Dashboards
  async getAICTEDashboard(): Promise<any> {
    return apiFetch<any>("/dashboard/aicte");
  },

  async getInstitutionDashboard(institutionId: string): Promise<any> {
    return apiFetch<any>(`/dashboard/institution/${institutionId}`);
  },

  // Institutions
  async getInstitutions(query?: string): Promise<any[]> {
    const q = query ? `?search=${encodeURIComponent(query)}` : "";
    return apiFetch<any[]>(`/institutions${q}`);
  },

  async getCourses(institutionId: string): Promise<any[]> {
    return apiFetch<any[]>(`/institutions/${institutionId}/courses`);
  },

  // Intake
  async getIntakes(institutionId?: string): Promise<any[]> {
    const q = institutionId ? `?institution_id=${encodeURIComponent(institutionId)}` : "";
    return apiFetch<any[]>(`/intake${q}`);
  },

  async getIntakeAlerts(academicYear?: string, institutionId?: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (academicYear) sp.set("academic_year", academicYear);
    if (institutionId) sp.set("institution_id", institutionId);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/intake/alerts${qs}`);
  },

  async getIntakeHistory(intakeId: string): Promise<any[]> {
    return apiFetch<any[]>(`/intake/${intakeId}/history`);
  },

  async setApprovedIntake(data: any, institutionId: string): Promise<any> {
    return apiFetch<any>(`/intake?institution_id=${encodeURIComponent(institutionId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Students
  async getStudents(params?: { institution_id?: string; search?: string; apaar_status?: string }): Promise<any[]> {
    const sp = new URLSearchParams();
    if (params?.institution_id) sp.set("institution_id", params.institution_id);
    if (params?.search) sp.set("search", params.search);
    if (params?.apaar_status) sp.set("apaar_status", params.apaar_status);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/students${qs}`);
  },

  async createStudent(data: any, institutionId: string): Promise<any> {
    return apiFetch<any>(`/students?institution_id=${encodeURIComponent(institutionId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async verifyApaar(studentId: string): Promise<any> {
    return apiFetch<any>(`/students/${studentId}/verify-apaar`, {
      method: "POST",
    });
  },

  // Bulk Upload
  async uploadBatch(file: File, institutionId: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("institution_id", institutionId);

    return apiFetch<any>("/imports/upload", {
      method: "POST",
      body: formData,
    });
  },

  async getBatchErrors(batchId: string): Promise<any[]> {
    return apiFetch<any[]>(`/imports/${batchId}/errors`);
  },

  async listBatches(institutionId?: string): Promise<any[]> {
    const q = institutionId ? `?institution_id=${encodeURIComponent(institutionId)}` : "";
    return apiFetch<any[]>(`/imports/batches${q}`);
  },

  // Duplicates & Alerts
  async getDuplicateAlerts(statusFilter?: string, severity?: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (statusFilter) sp.set("status_filter", statusFilter);
    if (severity) sp.set("severity", severity);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/validation/duplicates${qs}`);
  },

  async resolveDuplicate(alertId: string, status: string, notes: string): Promise<any> {
    return apiFetch<any>(`/validation/duplicates/${alertId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status, resolution_notes: notes }),
    });
  },

  async getAnomalyAlerts(institutionId?: string): Promise<any[]> {
    const q = institutionId ? `?institution_id=${encodeURIComponent(institutionId)}` : "";
    return apiFetch<any[]>(`/validation/anomalies${q}`);
  },

  async triggerAnomalyScan(academicYear?: string): Promise<any> {
    const q = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : "";
    return apiFetch<any>(`/validation/anomalies/scan${q}`, {
      method: "POST",
    });
  },

  async submitAnomalyFeedback(alertId: string, feedback: string, status?: string): Promise<any> {
    return apiFetch<any>(`/validation/anomalies/${alertId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ feedback, status }),
    });
  },

  // Validation Engine Rules & Results
  async getValidationRules(): Promise<any[]> {
    return apiFetch<any[]>("/validation/rules");
  },

  async updateValidationRule(ruleId: string, data: { severity?: string; is_active?: boolean; parameters_json?: any }): Promise<any> {
    return apiFetch<any>(`/validation/rules/${ruleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getValidationResults(params?: { institution_id?: string; rule_id?: string; severity?: string }): Promise<any[]> {
    const sp = new URLSearchParams();
    if (params?.institution_id) sp.set("institution_id", params.institution_id);
    if (params?.rule_id) sp.set("rule_id", params.rule_id);
    if (params?.severity) sp.set("severity", params.severity);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/validation/results${qs}`);
  },

  // Verification
  async requestVerificationToken(studentId: string, purpose: string): Promise<any> {
    return apiFetch<any>("/verification/request", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, purpose }),
    });
  },

  async verifyPublicCredential(code: string): Promise<any> {
    return apiFetch<any>(`/verification/verify/${code}`);
  },

  async revokeVerificationToken(code: string, reason: string): Promise<any> {
    return apiFetch<any>(`/verification/${code}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Reports
  async getReportTypes(): Promise<{ id: string; title: string }[]> {
    return apiFetch<{ id: string; title: string }[]>("/reports/types");
  },

  async generateReport(params: { report_type: string; academic_year?: string; institution_id?: string; state?: string }): Promise<any> {
    const sp = new URLSearchParams();
    sp.set("report_type", params.report_type);
    if (params.academic_year) sp.set("academic_year", params.academic_year);
    if (params.institution_id) sp.set("institution_id", params.institution_id);
    if (params.state) sp.set("state", params.state);
    return apiFetch<any>(`/reports/generate?${sp.toString()}`);
  },

  async getEnrolmentReport(academicYear?: string): Promise<any[]> {
    const q = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : "";
    return apiFetch<any[]>(`/reports/enrolment${q}`);
  },

  // Innovation 6: AICTE Officer Assistant
  async askOfficerAssistant(question: string, academicYear?: string, institutionId?: string): Promise<any> {
    return apiFetch<any>("/assistant/query", {
      method: "POST",
      body: JSON.stringify({
        question,
        academic_year: academicYear || "2024-2025",
        institution_id: institutionId || null
      }),
    });
  },

  // Innovation 7: Data Quality Score
  async getInstitutionDQI(institutionId: string, academicYear?: string): Promise<any> {
    const q = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : "";
    return apiFetch<any>(`/data-quality/${institutionId}${q}`);
  },

  // Correction Requests
  async submitCorrection(data: { student_id: string; field_name: string; requested_value: string; justification: string; supporting_doc_ref?: string }, institutionId: string): Promise<any> {
    return apiFetch<any>(`/corrections?institution_id=${encodeURIComponent(institutionId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getCorrections(params?: { status_filter?: string; institution_id?: string }): Promise<any[]> {
    const sp = new URLSearchParams();
    if (params?.status_filter) sp.set("status_filter", params.status_filter);
    if (params?.institution_id) sp.set("institution_id", params.institution_id);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/corrections${qs}`);
  },

  async resolveCorrection(correctionId: string, status: string, reviewNotes: string): Promise<any> {
    return apiFetch<any>(`/corrections/${correctionId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status, review_notes: reviewNotes }),
    });
  },

  // Audit Logs
  async getAuditLogs(params?: { action?: string; resource_type?: string; institution_id?: string; limit?: number }): Promise<any[]> {
    const sp = new URLSearchParams();
    if (params?.action) sp.set("action", params.action);
    if (params?.resource_type) sp.set("resource_type", params.resource_type);
    if (params?.institution_id) sp.set("institution_id", params.institution_id);
    if (params?.limit) sp.set("limit", params.limit.toString());
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/audit/${qs}`);
  },

  // User Management
  async getUsers(params?: { search?: string; role?: string }): Promise<any[]> {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.role) sp.set("role", params.role);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/auth/users${qs}`);
  },

  async createUser(data: { email: string; password: string; full_name: string; phone_number?: string; roles: string[]; institution_id?: string }): Promise<any> {
    return apiFetch<any>("/auth/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async toggleUserStatus(userId: string): Promise<any> {
    return apiFetch<any>(`/auth/users/${userId}/status`, {
      method: "PATCH",
    });
  },
};


