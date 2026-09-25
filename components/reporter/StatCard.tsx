export default function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "error" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-success-600"
      : tone === "warning"
        ? "text-warning-600"
        : tone === "error"
          ? "text-error-600"
          : tone === "info"
            ? "text-info-600"
            : "text-text-900";

  return (
    <div className="card p-4 sm:p-5">
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight sm:text-3xl ${toneClass}`}>{value}</p>
    </div>
  );
}
