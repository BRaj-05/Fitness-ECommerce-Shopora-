export function PageSkeleton({ rows = 3 }) {
  return (
    <div className="shopora-page-skeleton" aria-hidden="true">
      <div className="shopora-skeleton h-4 w-28 rounded" />
      <div className="shopora-skeleton mt-4 h-12 w-3/5 rounded-lg" />
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {Array.from({ length: rows }, (_, index) => <div key={index} className="shopora-skeleton h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="lux-admin-table p-4" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => <div key={index} className="shopora-skeleton mb-3 h-14 rounded-lg last:mb-0" />)}
    </div>
  );
}

export function InvoiceSkeleton() {
  return (
    <div className="shopora-invoice-sheet mx-auto max-w-4xl p-8" aria-hidden="true">
      <div className="shopora-skeleton h-14 w-1/3 rounded-lg" />
      <div className="shopora-skeleton mt-12 h-72 rounded-xl" />
      <div className="shopora-skeleton ml-auto mt-8 h-28 w-72 rounded-xl" />
    </div>
  );
}
