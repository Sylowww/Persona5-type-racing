import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, preferredLocale } from "@/i18n/locales";

/** Sends `/` to the saved or browser language. Every other page already has its locale in the path. */
export function proxy(request: NextRequest) {
  const locale = preferredLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: "/",
};
