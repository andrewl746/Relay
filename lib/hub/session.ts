import { cookies } from "next/headers";
import { getUser } from "./data";
import { USER_COOKIE } from "./dev-login";
import { DEFAULT_USER_ID } from "./site";

export async function getCurrentUser() {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  const user = (id ? await getUser(id) : null) ?? (await getUser(DEFAULT_USER_ID));
  if (!user) throw new Error(`Default demo user ${DEFAULT_USER_ID} is missing from mock data`);
  return user;
}
