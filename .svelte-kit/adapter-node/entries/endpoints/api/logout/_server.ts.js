import { json } from "@sveltejs/kit";
import { b as base } from "../../../../chunks/server.js";
import "../../../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
const POST = async ({ cookies }) => {
  cookies.delete("session", { path: base || "/" });
  return json({ ok: true });
};
export {
  POST
};
