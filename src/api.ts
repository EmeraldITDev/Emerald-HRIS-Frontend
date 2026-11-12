import { API_BASE_URL as apiUrl } from "@/config/api";

export async function getUsers() {
  const res = await fetch(`${apiUrl}/users`);
  return res.json();
}

export async function createUser(data: any) {
  const res = await fetch(`${apiUrl}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
