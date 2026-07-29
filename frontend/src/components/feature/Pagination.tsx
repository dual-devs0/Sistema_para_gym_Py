interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-md px-lg py-md border-t border-outline-variant">
      <div className="flex items-center gap-sm font-body-sm text-on-surface-variant">
        <span>Mostrando {startItem}–{endItem} de {totalItems}</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="bg-surface border border-outline-variant rounded px-sm py-1 text-on-surface text-body-sm focus:border-primary focus:ring-0 focus:outline-none"
        >
          {itemsPerPageOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / pág
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-xs">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-body-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-primary text-on-primary"
                : "text-on-surface hover:bg-surface-container-highest"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Página ${page}`}
          >
            {page}
          </button>
        ))}

        {totalPages > 5 && (
          <>
            <span className="px-1 text-on-surface-variant">…</span>
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 rounded-lg text-body-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
              aria-label={`Página ${totalPages}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}