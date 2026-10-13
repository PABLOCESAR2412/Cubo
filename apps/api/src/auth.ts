import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createRemoteJWKSet, type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { Env } from "./env.ts";

const githubKeys = createRemoteJWKSet(
  new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
);
type AuthContext = Context<{ Bindings: Env; Variables: { runnerId: string } }>;
export function localAccess(c: AuthContext): boolean {
  return (
    c.env.LOCAL_DEV === "true" && ["127.0.0.1", "localhost"].includes(new URL(c.req.url).hostname)
  );
}
export async function ownerAuthorized(c: AuthContext): Promise<boolean> {
  if (localAccess(c)) return true;
  if (!c.env.SESSION_SECRET || c.env.SESSION_SECRET.length < 32) return false;
  const cookie = getCookie(c, "cubo_session");
  if (!cookie) return false;
  try {
    await jwtVerify(cookie, new TextEncoder().encode(c.env.SESSION_SECRET), {
      issuer: "cubo",
      audience: "owner",
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}
export async function sessionToken(env: Env): Promise<string> {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)
    throw new Error("Autenticación sin configurar.");
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("cubo")
    .setAudience("owner")
    .setExpirationTime("8h")
    .sign(new TextEncoder().encode(env.SESSION_SECRET));
}
export async function passwordMatches(value: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all(
    [value, expected].map((v) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(v))),
  );
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return difference === 0;
}
export function verifyRunnerClaims(payload: JWTPayload, env: Env): string {
  const repository = env.GITHUB_REPOSITORY;
  if (
    payload.repository !== repository ||
    payload.ref !== `refs/heads/${env.GITHUB_REF}` ||
    payload.workflow_ref !==
      `${repository}/.github/workflows/${env.GITHUB_WORKFLOW}@refs/heads/${env.GITHUB_REF}` ||
    payload.event_name !== "workflow_dispatch" ||
    payload.runner_environment !== "github-hosted" ||
    typeof payload.run_id !== "string" ||
    !/^\d+$/.test(payload.run_id)
  ) {
    throw new Error("Identidad del runner no autorizada.");
  }
  return payload.run_id;
}
export async function runnerAuthorized(c: AuthContext): Promise<string> {
  const token = c.req.header("Authorization")?.replace(/^Bearer /, "");
  if (!token || !c.env.CUBO_URL) throw new Error("Falta identidad del runner.");
  const { payload } = await jwtVerify(token, githubKeys, {
    issuer: "https://token.actions.githubusercontent.com",
    audience: c.env.CUBO_URL,
    algorithms: ["RS256"],
  });
  return verifyRunnerClaims(payload, c.env);
}
