import ProductImage from "./ProductImage";

export default function ProductVisual({ product, className = "", priority = false }) {
  return <ProductImage product={product} className={className} priority={priority} />;
}
