import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function PhotoCredits() {
  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/products/real/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("Photo manifest is not available.");
        return response.json();
      })
      .then((data) => {
        if (active) setManifest(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load photo credits.");
      });

    return () => {
      active = false;
    };
  }, []);

  const photos = useMemo(
    () => Object.values(manifest?.categories || {}).flat(),
    [manifest],
  );

  return (
    <main className="min-h-screen bg-[var(--lux-bg)] px-4 py-10 text-[var(--lux-ink)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="text-xs font-bold text-[var(--lux-muted)] hover:text-[var(--lux-ink)]"
        >
          ← Back to Shopora
        </Link>

        <p className="mt-10 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--lux-muted)]">
          IMAGE CREDITS
        </p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-[-0.045em] sm:text-6xl">
          Product photography.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--lux-muted)]">
          Shopora uses selected Pexels photography for demo product imagery. Individual photographer and source links are listed below.
        </p>

        <a
          href="https://www.pexels.com/"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex text-sm font-bold underline underline-offset-4"
        >
          Photos provided by Pexels
        </a>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <article
              key={`${photo.productId}-${photo.pexelsId}`}
              className="overflow-hidden rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)]"
            >
              <img
                src={photo.publicPath}
                alt={photo.alt || photo.productName}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <p className="text-sm font-extrabold">{photo.productName}</p>
                <p className="mt-1 text-xs text-[var(--lux-muted)]">Photo by {photo.photographer}</p>
                <a
                  href={photo.pexelsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-xs font-bold underline underline-offset-4"
                >
                  View original on Pexels
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
