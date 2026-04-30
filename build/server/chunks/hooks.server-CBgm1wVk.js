import { v as verifySessionCookie } from './auth-BaKqY0Pn.js';
import 'fs';
import 'crypto';
import 'path';
import './shared-server-DaWdgxVh.js';

const handle = async ({ event, resolve }) => {
  const session_cookie = event.cookies.get("session");
  event.locals.user = session_cookie ? verifySessionCookie(session_cookie) : null;
  return resolve(event);
};

export { handle };
//# sourceMappingURL=hooks.server-CBgm1wVk.js.map
