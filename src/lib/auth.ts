import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "gymlo_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gymlo_jwt_secret_super_secure_key_2026_fitness_app"
);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: {
  userId: string;
  email?: string | null;
  name?: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d") // 1 year remember me for mobile PWA convenience
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{
  userId: string;
  email?: string | null;
  name?: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.userId || typeof payload.userId !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      email: (payload.email as string) || null,
      name: (payload.name as string) || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the current authenticated user from cookies.
 * Falls back to "guest-user" if no user is signed in yet, allowing seamless transition.
 */
export async function getSessionUser(request?: Request): Promise<{
  id: string;
  email: string | null;
  name: string;
} | null> {
  let token: string | undefined;

  // 1. Try reading from Request headers if provided
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // 2. Try reading via next/headers cookies()
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Outside of request context or already streamed
    }
  }

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return user;
}
