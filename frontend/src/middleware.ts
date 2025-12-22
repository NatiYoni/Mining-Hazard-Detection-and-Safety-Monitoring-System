import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // We can't access localStorage in middleware, so we rely on cookies or just client-side checks.
  // For a robust app, we should store the token in a cookie.
  // For this MVP, we'll rely on the client-side AuthContext to redirect if not logged in.
  // However, we can add a simple check if we were using cookies.
  
  // Since we are using localStorage for the token (as per AuthContext implementation),
  // we cannot validate the token in the middleware.
  // We will rely on the AuthContext's useEffect to redirect unauthenticated users.
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
