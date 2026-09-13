import { cookies } from "next/headers";
import { getUser, getUsers } from "./data";
import { USER_COOKIE } from "./dev-login";
import { DEFAULT_USER_ID } from "./site";

export async function getCurrentUser() {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  let user = id ? await getUser(id) : null;
  
  if (!user) {
    user = await getUser(DEFAULT_USER_ID);
  }
  
  if (!user) {
    const allUsers = await getUsers();
    user = allUsers[0];
  }

  if (!user) throw new Error(`No users exist in the dataset.`);
  return user;
}
