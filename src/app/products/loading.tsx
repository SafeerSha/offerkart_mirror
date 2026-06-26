import { Filter, Star } from "lucide-react";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="pt-40 lg:pt-28"></div>

      <main className="container mx-auto px-4 pt-2 pb-8 lg:py-8">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mb-6" />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-32">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-300" />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              </h2>
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="space-y-3">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-9 w-full bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Grid skeleton */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="flex items-center gap-4 w-full">
                <div className="h-8 w-1.5 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2 w-full max-w-xs">
                  <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col h-full"
                >
                  <div className="relative aspect-square bg-gray-100 animate-pulse" />
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="space-y-1">
                        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
