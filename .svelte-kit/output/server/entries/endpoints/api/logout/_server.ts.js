import { json } from "@sveltejs/kit";
const POST = async ({ cookies }) => {
  cookies.delete("session", { path: "/" });
  return json({ ok: true });
};
export {
  POST
};
