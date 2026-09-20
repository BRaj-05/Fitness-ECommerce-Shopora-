import { useState } from "react";
import EditorialProductVisual from "./EditorialProductVisual";

export default function ProductVisual({ product, className = "" }) {
  const [failed, setFailed] = useState(false);
  const generated = String(product?.image || "").includes("/products/generated/");

  if (product?.image && !failed) {
    return (
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={generated ? `h-full w-full object-contain p-4 ${className}` : `h-full w-full object-cover ${className}`}
      />
    );
  }

  return <EditorialProductVisual product={product} className={className} />;
}
