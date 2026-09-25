import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="headline-lg text-text-900">Create an account</h1>
        <p className="mt-1 text-sm text-text-600">
          Join to save your reading preferences and manage a subscription.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-text-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
