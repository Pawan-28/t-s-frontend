export default function Loading() {
  return (
    <div className="section-stack">
      <div className="mb-2 h-8 w-64 skeleton" />
      <div className="h-4 w-full max-w-2xl skeleton" />
      <div className="h-16 w-full skeleton" />
      <div className="h-64 w-full skeleton" />
    </div>
  );
}
