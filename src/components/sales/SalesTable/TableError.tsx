interface TableErrorProps {
  error: string;
  onRetry?: () => void;
}

export const TableError = ({ error, onRetry }: TableErrorProps) => {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-red-600 mb-4">Error: {error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};