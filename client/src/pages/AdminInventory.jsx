import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminNavbar from "../components/AdminNavbar";
import ProductVisual from "../components/ProductVisual";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { API_URL } from "../config/app";
import { fmt } from "../utils/formatters";

const API = `${API_URL}/api`;

const PRODUCT_TYPES = [
  "Protein Powder",
  "Protein Bar",
  "Shaker Bottle",
  "Jump Rope",
  "Resistance Bands",
  "Yoga Mat",
  "Foam Roller",
  "Fitness Tracker",
  "Other",
];

const CATEGORIES = [
  "Nutrition",
  "Training Gear",
  "Recovery",
  "Wearables",
];

const EMPTY_FORM = {
  productId: "",
  name: "",
  brand: "",
  category: "Training Gear",
  type: "Other",
  price: "",
  originalPrice: "",
  rating: 0,
  reviews: 0,
  badge: "",
  image: "",
  stock: "",
  reserved: 0,
  description: "",
  highlightsText: "",
};

function available(product) {
  if (product.stock === null) {
    return null;
  }

  return Math.max(
    0,
    Number(product.stock || 0) -
      Number(product.reserved || 0),
  );
}

function status(product) {
  const value = available(product);

  if (value === null) {
    return {
      label: "Unlimited",
      className:
        "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    };
  }

  if (value <= 0) {
    return {
      label: "Out",
      className:
        "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    };
  }

  if (value <= 5) {
    return {
      label: "Low",
      className:
        "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    };
  }

  return {
    label: "In stock",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
}

function Modal({
  open,
  onClose,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl sm:p-7">
        {children}
      </div>
    </div>
  );
}

export default function AdminInventory() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        `${API}/products?all=true`,
        {
          headers,
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load inventory",
        );
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data)
          ? data
          : data?.data || [],
      );
    } catch (loadError) {
      setError(
        loadError.message ||
          "Unable to load inventory",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title =
      "Inventory | Shopora";

    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    const finite = products.filter(
      (product) =>
        product.stock !== null,
    );

    return {
      products: products.length,

      units: finite.reduce(
        (sum, product) =>
          sum +
          Number(product.stock || 0),
        0,
      ),

      reserved: finite.reduce(
        (sum, product) =>
          sum +
          Number(
            product.reserved || 0,
          ),
        0,
      ),

      low: finite.filter(
        (product) =>
          available(product) <= 5,
      ).length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    return products.filter(
      (product) => {
        const typeMatch =
          typeFilter === "All" ||
          product.type === typeFilter;

        const searchMatch =
          !normalized ||
          [
            product.productId,
            product.name,
            product.brand,
            product.type,
            product.category,
          ]
            .filter(
              (value) =>
                value !==
                  undefined &&
                value !== null,
            )
            .join(" ")
            .toLowerCase()
            .includes(normalized);

        return (
          typeMatch &&
          searchMatch
        );
      },
    );
  }, [
    products,
    query,
    typeFilter,
  ]);

  const nextProductId = () =>
    products.reduce(
      (max, product) =>
        Math.max(
          max,
          Number(
            product.productId || 0,
          ),
        ),
      1025,
    ) + 1;

  const openCreate = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      productId:
        nextProductId(),
    });

    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(
      product.productId,
    );

    setForm({
      productId:
        product.productId,
      name:
        product.name || "",
      brand:
        product.brand || "",
      category:
        product.category ||
        "Training Gear",
      type:
        product.type || "Other",
      price:
        product.price ?? "",
      originalPrice:
        product.originalPrice ??
        "",
      rating:
        product.rating ?? 0,
      reviews:
        product.reviews ?? 0,
      badge:
        product.badge || "",
      image:
        product.image || "",
      stock:
        product.stock === null
          ? ""
          : product.stock,
      reserved:
        product.reserved ?? 0,
      description:
        product.description || "",
      highlightsText:
        (
          product.highlights || []
        ).join("\n"),
    });

    setModalOpen(true);
  };

  const setField = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const uploadProductImage =
    async (file) => {
      if (!file) return;

      setUploadingImage(true);
      setError("");

      try {
        const authHeaders =
          await getAuthHeaders();

        const headers = {
          ...authHeaders,
        };

        delete headers[
          "Content-Type"
        ];

        const body =
          new FormData();

        body.append(
          "image",
          file,
        );

        const response =
          await fetch(
            `${API}/products/upload-image`,
            {
              method: "POST",
              headers,
              credentials:
                "include",
              body,
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to upload image",
          );
        }

        setField(
          "image",
          data.imageUrl,
        );
      } catch (
        uploadError
      ) {
        setError(
          uploadError.message ||
            "Unable to upload image",
        );
      } finally {
        setUploadingImage(
          false,
        );
      }
    };

  const payloadFromForm = () => {
    const highlights =
      form.highlightsText
        .split("\n")
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean)
        .slice(0, 8);

    return {
      productId: Number(
        form.productId,
      ),

      name: form.name.trim(),

      brand:
        form.brand.trim(),

      category:
        form.category,

      type:
        form.type,

      price: Number(form.price),

      originalPrice:
        form.originalPrice === ""
          ? null
          : Number(
              form.originalPrice,
            ),

      rating:
        Number(form.rating || 0),

      reviews:
        Number(form.reviews || 0),

      badge:
        form.badge.trim() ||
        null,

      image:
        form.image.trim(),

      stock:
        form.stock === ""
          ? null
          : Number(form.stock),

      reserved:
        Number(form.reserved || 0),

      description:
        form.description.trim(),

      highlights,
    };
  };

  const saveProduct = async () => {
    const payload =
      payloadFromForm();

    if (
      !Number.isInteger(
        payload.productId,
      ) ||
      payload.productId <= 0
    ) {
      setError(
        "Product ID must be a positive integer.",
      );
      return;
    }

    if (!payload.name) {
      setError(
        "Product name is required.",
      );
      return;
    }

    if (
      !Number.isFinite(
        payload.price,
      ) ||
      payload.price <= 0
    ) {
      setError(
        "Price must be greater than zero.",
      );
      return;
    }

    if (
      payload.stock !== null &&
      (!Number.isInteger(
        payload.stock,
      ) ||
        payload.stock < 0)
    ) {
      setError(
        "Stock must be a non-negative whole number.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const headers =
        await getAuthHeaders();

      const isEditing =
        editingId !== null;

      const url = isEditing
        ? `${API}/products/${editingId}`
        : `${API}/products`;

      const response = await fetch(
        url,
        {
          method: isEditing
            ? "PUT"
            : "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(
            payload,
          ),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save product",
        );
      }

      setModalOpen(false);
      await fetchProducts();
    } catch (saveError) {
      setError(
        saveError.message ||
          "Unable to save product",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (
    product,
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`,
      );

    if (!confirmed) return;

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        `${API}/products/${product.productId}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data.error ||
            "Unable to delete product",
        );
      }

      await fetchProducts();
    } catch (deleteError) {
      setError(
        deleteError.message ||
          "Unable to delete product",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <AdminNavbar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <section className="lux-admin-hero flex-col items-start text-white sm:flex-row sm:items-end">
          <div>
            <p className="lux-eyebrow text-white/45">
              Inventory management
            </p>

            <h1 className="font-heading mt-2 text-4xl font-extrabold tracking-tight">
              Products
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Create products, update prices and stock, manage images and watch reserved inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="lux-primary-light w-fit"
          >
            + Add product
          </button>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [
              "Products",
              stats.products,
            ],
            [
              "Total units",
              stats.units,
            ],
            [
              "Reserved",
              stats.reserved,
            ],
            [
              "Low/out",
              stats.low,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="lux-admin-card p-5"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                {label}
              </p>

              <p className="font-heading mt-3 text-3xl font-extrabold">
                {loading
                  ? "—"
                  : Number(
                      value,
                    ).toLocaleString(
                      "en-IN",
                    )}
              </p>
            </div>
          ))}
        </section>

        <section className="lux-admin-card mt-6 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search product, brand, type or ID…"
              className="h-11 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-4 text-sm outline-none focus:border-[var(--lux-muted)]"
            />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 text-sm"
            >
              <option value="All">
                All product types
              </option>

              {PRODUCT_TYPES.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </div>
        </section>

        <section className="lux-admin-table mt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  {[
                    "Product",
                    "Type",
                    "Price",
                    "Stock",
                    "Reserved",
                    "Available",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {!loading &&
                  filtered.map(
                    (product) => {
                      const currentStatus =
                        status(
                          product,
                        );

                      const currentAvailable =
                        available(
                          product,
                        );

                      return (
                        <tr
                          key={
                            product.productId
                          }
                          className="transition hover:bg-stone-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                                <ProductVisual
                                  product={
                                    product
                                  }
                                />
                              </div>

                              <div>
                                <p className="max-w-64 truncate text-sm font-bold">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] text-stone-400">
                                  #{product.productId} ·{" "}
                                  {
                                    product.brand
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-xs text-stone-500">
                            {product.type ||
                              "Other"}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold">
                            {fmt(
                              product.price,
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {product.stock ===
                            null
                              ? "∞"
                              : product.stock}
                          </td>

                          <td className="px-5 py-4 text-sm text-stone-500">
                            {product.reserved ||
                              0}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold">
                            {currentAvailable ===
                            null
                              ? "∞"
                              : currentAvailable}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${currentStatus.className}`}
                            >
                              {
                                currentStatus.label
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    product,
                                  )
                                }
                                className="rounded-lg bg-[var(--lux-ink)] px-3 py-2 text-xs font-semibold text-[var(--lux-bg)] transition hover:opacity-85"
                              >
                                Edit / Restock
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteProduct(
                                    product,
                                  )
                                }
                                className="rounded-lg border border-transparent px-3 py-2 text-xs font-semibold text-[var(--lux-muted)] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}

                {!loading &&
                  filtered.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center text-sm text-stone-400"
                      >
                        No products match the current filter.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Modal
        open={modalOpen}
        onClose={() =>
          !saving &&
          setModalOpen(false)
        }
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
              {editingId
                ? `Product #${editingId}`
                : "New inventory item"}
            </p>

            <h2 className="font-heading mt-1 text-2xl font-extrabold">
              {editingId
                ? "Edit product"
                : "Add product"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalOpen(false)
            }
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            [
              "Product ID",
              "productId",
              "number",
            ],
            [
              "Product name",
              "name",
              "text",
            ],
            [
              "Brand",
              "brand",
              "text",
            ],
            [
              "Price (₹)",
              "price",
              "number",
            ],
            [
              "Original price (₹)",
              "originalPrice",
              "number",
            ],
            [
              "Stock quantity",
              "stock",
              "number",
            ],
            [
              "Reserved quantity",
              "reserved",
              "number",
            ],
            [
              "Rating",
              "rating",
              "number",
            ],
            [
              "Review count",
              "reviews",
              "number",
            ],
            [
              "Badge",
              "badge",
              "text",
            ],
            [
              "Image URL / local path",
              "image",
              "text",
            ],
          ].map(
            ([
              label,
              field,
              inputType,
            ]) => (
              <label
                key={field}
                className={
                  field === "image"
                    ? "sm:col-span-2"
                    : ""
                }
              >
                <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  {label}
                </span>

                <input
                  type={inputType}
                  step={
                    field === "rating"
                      ? "0.1"
                      : undefined
                  }
                  disabled={
                    field ===
                      "productId" &&
                    editingId !== null
                  }
                  value={form[field]}
                  onChange={(event) =>
                    setField(
                      field,
                      event.target.value,
                    )
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-500 disabled:bg-stone-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
            ),
          )}

          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Or upload a product image
            </span>

            <input
              type="file"
              accept="image/*"
              disabled={
                uploadingImage
              }
              onChange={(event) =>
                uploadProductImage(
                  event.target
                    .files?.[0],
                )
              }
              className="mt-1.5 block w-full rounded-xl border border-stone-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <p className="mt-1 text-[10px] text-stone-400">
              Optional. Requires Cloudinary. Without it, use a /products/... local path or HTTPS URL.
            </p>
          </label>

          {form.image && (
            <div className="sm:col-span-2 h-40 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 dark:border-slate-700">
              <ProductVisual
                product={{
                  ...form,
                  image:
                    form.image,
                }}
              />
            </div>
          )}

          <label>
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Category
            </span>

            <select
              value={form.category}
              onChange={(event) =>
                setField(
                  "category",
                  event.target.value,
                )
              }
              className="mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {CATEGORIES.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Product type
            </span>

            <select
              value={form.type}
              onChange={(event) =>
                setField(
                  "type",
                  event.target.value,
                )
              }
              className="mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {PRODUCT_TYPES.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Description
            </span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setField(
                  "description",
                  event.target.value,
                )
              }
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-stone-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Highlights — one per line
            </span>

            <textarea
              rows={5}
              value={
                form.highlightsText
              }
              onChange={(event) =>
                setField(
                  "highlightsText",
                  event.target.value,
                )
              }
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-stone-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              setModalOpen(false)
            }
            className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={saveProduct}
            className="rounded-full bg-stone-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
          >
            {saving
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Create product"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
