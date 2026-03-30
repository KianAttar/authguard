import axios from "axios";

const api = axios.create({
  baseURL: "/api/accounts",
  withCredentials: true,
});

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export interface MfaChallengeResponse {
  challenge: {
    id: string;
    method: string;
    expiresAt: string;
    status: string;
    sentAt: string;
  };
  mfaMethods: { method: string; identifier: string; isVerified: boolean }[];
}

export async function signIn(email: string, password: string) {
  return api.post<AuthResponse | MfaChallengeResponse>("/auth/signin", {
    email,
    password,
  });
}

export async function signUp(data: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}) {
  return api.post<AuthResponse | MfaChallengeResponse>("/auth/signup", data);
}

export async function verifyMfaChallenge(
  challengeId: string,
  verifier: string
) {
  return api.post<AuthResponse>("/auth/mfa/challenge/verify", {
    challengeId,
    verifier,
  });
}

export async function sendMfaChallenge(challengeId: string) {
  return api.post<{ challenge: MfaChallengeResponse["challenge"] }>(
    "/auth/mfa/challenge/send",
    { challengeId }
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (data.errors?.length) {
      return data.errors.map((e: { message: string }) => e.message).join(". ");
    }
    if (data.message) return data.message;
  }
  return "An unexpected error occurred";
}
