const BASE_URL =
  process.env
    .SHOPORA_API_URL ||
  "http://localhost:5000";

const EXPECTED_TYPES = [
  "Protein Powder",
  "Protein Bar",
  "Shaker Bottle",
  "Jump Rope",
  "Resistance Bands",
  "Yoga Mat",
  "Foam Roller",
  "Fitness Tracker",
];

async function getJson(
  path,
) {
  const response =
    await fetch(
      `${BASE_URL}${path}`,
    );

  const data =
    await response
      .json()
      .catch(
        async () => ({
          text:
            await response.text(),
        }),
      );

  if (!response.ok) {
    throw new Error(
      `${path} -> HTTP ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  return data;
}

async function main() {
  console.log(
    `Shopora smoke test: ${BASE_URL}`,
  );

  const productsPayload =
    await getJson(
      "/api/products?all=true",
    );

  const products =
    Array.isArray(
      productsPayload,
    )
      ? productsPayload
      : productsPayload.data ||
        [];

  if (
    products.length < 40
  ) {
    throw new Error(
      `Expected at least 40 products, found ${products.length}`,
    );
  }

  console.log(
    `✓ products: ${products.length}`,
  );

  for (
    const type of
      EXPECTED_TYPES
  ) {
    const count =
      products.filter(
        (product) =>
          product.type ===
          type,
      ).length;

    if (count < 5) {
      throw new Error(
        `${type}: expected at least 5, found ${count}`,
      );
    }

    console.log(
      `✓ ${type}: ${count}`,
    );
  }

  const powderPayload =
    await getJson(
      `/api/products?all=true&type=${encodeURIComponent(
        "Protein Powder",
      )}`,
    );

  const powderProducts =
    Array.isArray(
      powderPayload,
    )
      ? powderPayload
      : powderPayload.data ||
        [];

  if (
    powderProducts.some(
      (product) =>
        product.type !==
        "Protein Powder",
    )
  ) {
    throw new Error(
      "Server type filter returned a non-Protein-Powder product",
    );
  }

  console.log(
    `✓ server type filter: ${powderProducts.length} Protein Powder`,
  );

  const searchPayload =
    await getJson(
      `/api/products?all=true&search=${encodeURIComponent(
        "protein powder",
      )}`,
    );

  const searchProducts =
    Array.isArray(
      searchPayload,
    )
      ? searchPayload
      : searchPayload.data ||
        [];

  if (
    searchProducts.length <
    5
  ) {
    throw new Error(
      `Protein powder search expected >=5 matches, found ${searchProducts.length}`,
    );
  }

  console.log(
    `✓ protein powder search: ${searchProducts.length}`,
  );

  const first =
    products[0];

  const detail =
    await getJson(
      `/api/products/${first.productId}`,
    );

  if (
    Number(
      detail.productId,
    ) !==
    Number(
      first.productId,
    )
  ) {
    throw new Error(
      "Product detail endpoint returned the wrong product",
    );
  }

  console.log(
    `✓ product detail: ${detail.name}`,
  );

  const paymentConfig =
    await getJson(
      "/api/payment/config",
    );

  console.log(
    `✓ Razorpay: ${
      paymentConfig.configured
        ? paymentConfig.mode
        : "not configured"
    }`,
  );

  console.log(
    "SHOPORA_SMOKE_PASS",
  );
}

main().catch(
  (error) => {
    console.error(
      "SHOPORA_SMOKE_FAIL",
      error.message,
    );

    process.exit(1);
  },
);
