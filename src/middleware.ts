import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.APP_ACCESS_PASSWORD;
  if (!password) return NextResponse.next();
  const expected = `${process.env.APP_ACCESS_USERNAME ?? "trainer"}:${password}`;
  let actual = "";
  try { const header = request.headers.get("authorization") ?? ""; if (header.startsWith("Basic ") && header.length < 2000) actual = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(header.slice(6)), (character) => character.charCodeAt(0))); } catch { /* Invalid credentials receive the same challenge. */ }
  let difference = actual.length ^ expected.length;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ (actual.charCodeAt(index) || 0);
  if (difference === 0) return NextResponse.next();
  return new NextResponse("Требуется вход в персональный тренажер.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Deutsch B1", charset="UTF-8"', "Cache-Control": "no-store" } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
