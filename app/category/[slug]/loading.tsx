export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-8 h-10 w-64 skeleton" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[16/9] w-full skeleton" />
        ))}
      </div>
    </div>
  );
}
