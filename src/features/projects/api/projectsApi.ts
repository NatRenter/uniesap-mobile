import { apiRequest } from "@/api/client";

export async function testKoboConnection() {
  return apiRequest<unknown>("/");
}
