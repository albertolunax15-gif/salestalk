interface ProductsHeaderProps {
  title?: string;
  description?: string;
}

export const ProductsHeader = ({
  title = "Productos",
  description = "Listado (máx. 50)"
}: ProductsHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
};