const crypto =
  require("crypto");

const Cart =
  require("../models/Cart");

const Product =
  require("../models/Product");

const UserProfile =
  require("../models/UserProfile");

function normaliseCartItems(
  items = [],
) {
  return [...items]
    .map((item) => ({
      productId: Number(
        item.productId,
      ),
      quantity: Number(
        item.quantity,
      ),
    }))
    .sort(
      (a, b) =>
        a.productId -
        b.productId,
    );
}

function hashCartItems(
  items = [],
) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify(
        normaliseCartItems(
          items,
        ),
      ),
    )
    .digest("hex");
}

async function getCurrentCartHash(
  userId,
) {
  const cart =
    await Cart.findOne({
      userId,
    }).lean();

  if (
    !cart ||
    !cart.items?.length
  ) {
    throw new Error(
      "Cart is empty",
    );
  }

  return hashCartItems(
    cart.items,
  );
}

async function getCheckoutPricing({
  userId,
  addressId,
}) {
  if (!userId) {
    throw new Error(
      "userId is required",
    );
  }

  const [
    cart,
    profile,
  ] =
    await Promise.all([
      Cart.findOne({
        userId,
      }).lean(),

      UserProfile.findOne({
        userId,
      }).lean(),
    ]);

  if (
    !cart ||
    !cart.items?.length
  ) {
    throw new Error(
      "Cart is empty",
    );
  }

  const addresses =
    profile?.addresses || [];

  const shippingAddress =
    addresses.find(
      (address) =>
        String(address.id) ===
        String(addressId),
    );

  if (!shippingAddress) {
    throw new Error(
      "Select a valid shipping address",
    );
  }

  const ids =
    cart.items.map(
      (item) =>
        Number(
          item.productId,
        ),
    );

  const products =
    await Product.find({
      productId: {
        $in: ids,
      },
    }).lean();

  const productMap =
    new Map(
      products.map(
        (product) => [
          Number(
            product.productId,
          ),
          product,
        ],
      ),
    );

  const items = [];
  let subtotal = 0;

  for (
    const item of cart.items
  ) {
    const product =
      productMap.get(
        Number(
          item.productId,
        ),
      );

    if (!product) {
      throw new Error(
        `Product ${item.productId} no longer exists`,
      );
    }

    const quantity =
      Number(
        item.quantity,
      );

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        "Cart contains an invalid quantity",
      );
    }

    if (
      product.stock !== null
    ) {
      if (
        Number(
          product.stock || 0,
        ) < quantity
      ) {
        throw new Error(
          `${product.name} does not have enough stock`,
        );
      }

      if (
        Number(
          product.reserved || 0,
        ) < quantity
      ) {
        throw new Error(
          `Reservation for ${product.name} is no longer valid. Refresh your cart.`,
        );
      }
    }

    const price =
      Number(
        product.price,
      );

    items.push({
      productId:
        product.productId,
      quantity,
      price,
    });

    subtotal +=
      price * quantity;
  }

  const discountPercent =
    profile &&
    !profile.discountUsed
      ? Math.max(
          0,
          Number(
            profile.discountPercent ||
              0,
          ),
        )
      : 0;

  const discountAmount =
    Math.round(
      (subtotal *
        discountPercent) /
        100,
    );

  const total =
    Math.max(
      0,
      subtotal -
        discountAmount,
    );

  return {
    userId,
    items,
    subtotal,
    discountPercent,
    discountAmount,
    total,
    currency: "INR",
    cartHash:
      hashCartItems(
        cart.items,
      ),

    shippingAddress: {
      id:
        shippingAddress.id ||
        "",
      label:
        shippingAddress.label ||
        "",
      line1:
        shippingAddress.line1 ||
        "",
      line2:
        shippingAddress.line2 ||
        "",
      city:
        shippingAddress.city ||
        "",
      state:
        shippingAddress.state ||
        "",
      zip:
        shippingAddress.zip ||
        "",
      country:
        shippingAddress.country ||
        "",
      phone:
        shippingAddress.phone ||
        "",
    },
  };
}

module.exports = {
  getCheckoutPricing,
  getCurrentCartHash,
  hashCartItems,
};
