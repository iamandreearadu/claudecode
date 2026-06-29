// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { createSession, getSession, deleteSession, verifySession } from "../auth";

const TEST_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(
  payload: Record<string, unknown>,
  expiresIn: string = "7d"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(TEST_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe("createSession", () => {
  test("sets an httpOnly auth-token cookie", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("embeds userId and email in the JWT", async () => {
    await createSession("user-123", "test@example.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, TEST_SECRET);
    expect(payload.userId).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
  });

  test("sets cookie expiry to approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-123", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  test("returns null for an invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-a-valid-jwt" });
    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken(
      { userId: "user-123", email: "test@example.com", expiresAt: new Date() },
      "-1s"
    );
    mockCookieStore.get.mockReturnValue({ value: token });
    expect(await getSession()).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    const expiresAt = new Date();
    const token = await makeToken({
      userId: "user-123",
      email: "test@example.com",
      expiresAt,
    });
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-123");
    expect(session!.email).toBe("test@example.com");
  });
});

// ---------------------------------------------------------------------------
// deleteSession
// ---------------------------------------------------------------------------

describe("deleteSession", () => {
  test("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

// ---------------------------------------------------------------------------
// verifySession
// ---------------------------------------------------------------------------

describe("verifySession", () => {
  test("returns null when no cookie is present", async () => {
    const request = new NextRequest("http://localhost:3000/api/test");
    expect(await verifySession(request)).toBeNull();
  });

  test("returns null for an invalid token", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { cookie: "auth-token=invalid-token" },
    });
    expect(await verifySession(request)).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken(
      { userId: "user-123", email: "test@example.com", expiresAt: new Date() },
      "-1s"
    );
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { cookie: `auth-token=${token}` },
    });
    expect(await verifySession(request)).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    const expiresAt = new Date();
    const token = await makeToken({
      userId: "user-456",
      email: "other@example.com",
      expiresAt,
    });
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { cookie: `auth-token=${token}` },
    });

    const session = await verifySession(request);
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-456");
    expect(session!.email).toBe("other@example.com");
  });
});
