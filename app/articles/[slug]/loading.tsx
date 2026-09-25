export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mx-auto max-w-prose">
        <div className="mb-4 h-6 w-24 skeleton" />
        <div className="mb-3 h-10 w-full skeleton" />
        <div className="mb-8 h-4 w-40 skeleton" />
        <div className="mb-8 aspect-[16/9] w-full skeleton" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}
