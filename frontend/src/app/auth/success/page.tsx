"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function AuthSuccessInner() {
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
    <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>Signing you in...</p>
  );
}

export default function AuthSuccess() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>}>
        <AuthSuccessInner />
      </Suspense>
    </main>
  );
}
