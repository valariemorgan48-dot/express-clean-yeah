export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/employee/:path*", "/manager/:path*"],
};
