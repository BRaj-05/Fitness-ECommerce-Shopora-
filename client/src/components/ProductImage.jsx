import { useState } from "react";

export default function ProductImage({
  product,
  src,
  alt,
  priority = false,
  className = "",
  imgClassName = "",
  placeholderColor = "#e7e5e4",
}) {
  const primarySrc = String(src || product?.image || "").trim();
  const productId = product?.productId ?? product?.id;
  const fallbackSrc = productId
    ? `/products/generated/${productId}.svg`
    : "";

  return (
    <Photo
      key={`${primarySrc}|${fallbackSrc}`}
      primarySrc={primarySrc}
      fallbackSrc={fallbackSrc}
      alt={alt || product?.name || "Shopora product"}
      priority={priority}
      className={className}
      imgClassName={imgClassName}
      placeholderColor={placeholderColor}
    />
  );
}

function Photo({
  primarySrc,
  fallbackSrc,
  alt,
  priority,
  className,
  imgClassName,
  placeholderColor,
}) {
  const [stage, setStage] = useState(primarySrc ? "primary" : fallbackSrc ? "fallback" : "empty");
  const [loaded, setLoaded] = useState(false);

  const activeSrc = stage === "primary"
    ? primarySrc
    : stage === "fallback"
      ? fallbackSrc
      : "";

  const usingGeneratedArtwork = stage === "fallback";

  const handleError = () => {
    setLoaded(false);

    if (stage === "primary" && fallbackSrc) {
      setStage("fallback");
      return;
    }

    setStage("empty");
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {activeSrc ? (
        <img
          src={activeSrc}
          alt={alt}
          width={1000}
          height={1000}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`h-full w-full motion-safe:transition-opacity motion-safe:duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${
            usingGeneratedArtwork
              ? "object-contain p-4"
              : "object-cover"
          } ${imgClassName}`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-100 to-stone-200 p-5 text-center dark:from-slate-800 dark:to-slate-900">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 dark:text-slate-500">
              SHOPORA
            </p>
            <p className="mt-2 text-sm font-bold text-stone-700 dark:text-slate-200">
              {alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
