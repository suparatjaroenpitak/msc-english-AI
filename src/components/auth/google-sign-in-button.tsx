"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl });
    setLoading(false);
  }

  return (
    <Button type="button" className="w-full" onClick={handleSignIn} disabled={loading}>
      {loading ? "กำลังเชื่อมต่อ Google…" : "เข้าสู่ระบบด้วย Google"}
    </Button>
  );
}
