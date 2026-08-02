export default function Loading() {
  return (
    <div className="min-h-screen bg-page animate-pulse">
      <div className="h-64 bg-surface/20 mb-8" />
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-surface/20 rounded-full" />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-surface/20 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
