// Copy into UI/src/lib/healthApi.ts. Keep token in memory and supply it after login.
// A page reload requires reauthentication unless the app adds a session strategy.
export class ApiError extends Error {
  constructor(public status: number, public detail: unknown) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}

export function createHealthApi(baseUrl = "http://localhost:8000/api/v1") {
  let token: string | null = null;
  async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new ApiError(response.status, error.detail);
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  }
  return {
    request,
    setToken(value: string | null) { token = value; },
    async logout() {
      await request<void>("/auth/logout", "POST");
      token = null;
    },
  };
}
