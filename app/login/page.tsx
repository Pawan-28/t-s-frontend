import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="headline-lg text-text-900">Log in</h1>
        <p className="mt-1 text-sm text-text-600">Welcome back. Enter your details to continue.</p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-text-600">
          Don&rsquo;t have an account?{" "}
          <Link href="/register" className="font-semibold text-accent-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
