import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getMySubscription } from "@/lib/auth/currentUser";
import { formatDate } from "@/lib/format";
import LogoutButton from "@/components/LogoutButton";
import PhoneVerifyForm from "@/components/PhoneVerifyForm";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: true },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const subscription = await getMySubscription();
  const isActive = Boolean(subscription && subscription.is_active_now);

  return (
    <div className="container-page section-stack py-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-200 pb-6">
        <div>
          <span className="eyebrow text-accent-600">Account</span>
          <h1 className="headline-lg mt-1 text-text-900">Hi, {user.first_name || user.full_name}</h1>
        </div>
        <LogoutButton />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-text-900">Profile</h2>
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-text-400">Name</dt>
            <dd className="text-text-900">{user.full_name}</dd>
            <dt className="text-text-400">Email</dt>
            <dd className="break-all text-text-900">{user.email}</dd>
            <dt className="text-text-400">Role</dt>
            <dd className="text-text-900">{user.role}</dd>
          </dl>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-text-900">Subscription</h2>
            <span className={`badge ${isActive ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}>
              {subscription ? subscription.status : "None"}
            </span>
          </div>
          {subscription && isActive ? (
            <p className="text-sm text-text-900">
              You have an active <span className="font-semibold">{subscription.plan.name}</span>{" "}
              subscription until{" "}
              <span className="font-semibold">{formatDate(subscription.expires_at)}</span>.
            </p>
          ) : subscription ? (
            <p className="text-sm text-text-900">
              Your {subscription.plan.name} subscription is {subscription.status.toLowerCase()}.{" "}
              <Link href="/subscribe" className="font-semibold text-accent-600 hover:underline">
                Renew now
              </Link>
              .
            </p>
          ) : (
            <p className="text-sm text-text-900">
              You don&rsquo;t have a subscription yet.{" "}
              <Link href="/subscribe" className="font-semibold text-accent-600 hover:underline">
                Subscribe
              </Link>
              .
            </p>
          )}
        </section>
      </div>

      <section className="card p-6">
        <h2 className="mb-1 text-lg font-bold text-text-900">WhatsApp phone verification</h2>
        <p className="mb-4 text-sm text-text-400">
          Optional &mdash; verifying your phone is never required to subscribe or read articles.
        </p>
        {user.phone && (
          <p className="mb-3 text-sm text-text-600">Current number on file: {user.phone}</p>
        )}
        <PhoneVerifyForm currentPhone={user.phone} />
      </section>
    </div>
  );
}
