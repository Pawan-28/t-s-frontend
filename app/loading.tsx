export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 h-8 w-48 skeleton" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[16/9] w-full skeleton rounded-none" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-20 skeleton" />
              <div className="h-5 w-full skeleton" />
              <div className="h-4 w-2/3 skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
