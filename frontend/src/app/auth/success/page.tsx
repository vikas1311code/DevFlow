"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthSuccess() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");
    if (token && refresh) {
      login(token, refresh);
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>Signing you in...</p>
    </main>
  );
}
