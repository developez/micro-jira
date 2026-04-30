import { v as verifySessionCookie } from "../chunks/auth.js";
const handle = async ({ event, resolve }) => {
  const session_cookie = event.cookies.get("session");
  event.locals.user = session_cookie ? verifySessionCookie(session_cookie) : null;
  return resolve(event);
};
export {
  handle
};
