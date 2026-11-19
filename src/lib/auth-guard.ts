import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession(callbackUrl = "/dashboard") {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
}
