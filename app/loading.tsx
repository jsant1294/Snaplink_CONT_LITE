export default function Loading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="animate-pulse">
        <div className="h-16 bg-sand/30 mb-8" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-64 bg-sand/20 rounded-2xl mb-8" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-sand/20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
