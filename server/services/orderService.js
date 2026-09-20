const Order =
  require("../models/Order");

const Cart =
  require("../models/Cart");

const Product =
  require("../models/Product");

async function rollbackInventory(
  applied,
) {
  for (
    const entry of [
      ...applied,
    ].reverse()
  ) {
    try {
      if (
        entry.unlimited
      ) {
        await Product.updateOne(
          {
            productId:
              entry.productId,
          },
          {
            $inc: {
              reserved:
                entry.quantity,
            },
          },
        );
      } else {
        await Product.updateOne(
          {
            productId:
              entry.productId,
          },
          {
            $inc: {
              stock:
                entry.quantity,
              reserved:
                entry.quantity,
            },
          },
        );
      }
    } catch (
      rollbackError
    ) {
      console.error(
        "Inventory rollback failed:",
        rollbackError.message,
      );
    }
  }
}

async function createOrder(
  userId,
  explicitItems = null,
  pricing = null,
  shippingAddress = null,
  razorpayOrderId = null,
) {
  let orderItems =
    explicitItems;

  if (
    !orderItems ||
    !orderItems.length
  ) {
    const cart =
      await Cart.findOne({
        userId,
      });

    if (
      !cart ||
      !cart.items.length
    ) {
      throw new Error(
        "Cart is empty",
      );
    }

    orderItems =
      cart.items.map(
        (item) => ({
          productId:
            item.productId,
          quantity:
            item.quantity,
        }),
      );
  }

  const priceMap =
    new Map(
      (
        pricing?.items ||
        []
      ).map(
        (item) => [
          Number(
            item.productId,
          ),
          Number(
            item.price,
          ),
        ],
      ),
    );

  const populated = [];
  const productDocs = [];

  let subtotal = 0;

  for (
    const item of orderItems
  ) {
    const product =
      await Product.findOne({
        productId:
          Number(
            item.productId,
          ),
      });

    if (!product) {
      throw new Error(
        `Product ${item.productId} not found`,
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
        "Invalid order quantity",
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
          `Insufficient stock for ${product.name}`,
        );
      }

      if (
        Number(
          product.reserved || 0,
        ) < quantity
      ) {
        throw new Error(
          `Reservation for ${product.name} is no longer valid`,
        );
      }
    }

    const snapshotPrice =
      priceMap.has(
        Number(
          product.productId,
        ),
      )
        ? priceMap.get(
            Number(
              product.productId,
            ),
          )
        : Number(
            product.price,
          );

    populated.push({
      productId:
        product.productId,
      quantity,
      price:
        snapshotPrice,
    });

    subtotal +=
      snapshotPrice *
      quantity;

    productDocs.push({
      product,
      quantity,
    });
  }

  if (
    pricing &&
    Number(
      pricing.subtotal,
    ) !== subtotal
  ) {
    throw new Error(
      "Checkout pricing snapshot is inconsistent",
    );
  }

  const applied = [];

  try {
    for (
      const {
        product,
        quantity,
      } of productDocs
    ) {
      let updated;

      if (
        product.stock === null
      ) {
        updated =
          await Product.findOneAndUpdate(
            {
              productId:
                product.productId,

              reserved: {
                $gte:
                  quantity,
              },
            },
            {
              $inc: {
                reserved:
                  -quantity,
              },
            },
            {
              returnDocument:
                "after",
            },
          );

        if (!updated) {
          throw new Error(
            `Unable to finalise reservation for ${product.name}`,
          );
        }

        applied.push({
          productId:
            product.productId,
          quantity,
          unlimited: true,
        });
      } else {
        updated =
          await Product.findOneAndUpdate(
            {
              productId:
                product.productId,

              stock: {
                $gte:
                  quantity,
              },

              reserved: {
                $gte:
                  quantity,
              },
            },
            {
              $inc: {
                stock:
                  -quantity,
                reserved:
                  -quantity,
              },
            },
            {
              returnDocument:
                "after",
            },
          );

        if (!updated) {
          throw new Error(
            `Unable to finalise stock for ${product.name}`,
          );
        }

        applied.push({
          productId:
            product.productId,
          quantity,
          unlimited: false,
        });
      }
    }

    const finalSubtotal =
      pricing
        ? Number(
            pricing.subtotal,
          )
        : subtotal;

    const discountPercent =
      pricing
        ? Number(
            pricing.discountPercent ||
              0,
          )
        : 0;

    const discountAmount =
      pricing
        ? Number(
            pricing.discountAmount ||
              0,
          )
        : 0;

    const total =
      pricing
        ? Number(
            pricing.total,
          )
        : finalSubtotal;

    const order =
      await Order.create({
        userId,
        items: populated,
        subtotal:
          finalSubtotal,
        discountPercent,
        discountAmount,
        total,
        currency:
          pricing?.currency ||
          "INR",
        shippingAddress:
          shippingAddress ||
          pricing?.shippingAddress ||
          null,
        razorpayOrderId:
          razorpayOrderId ||
          null,
        status: "created",
      });

    await Cart.findOneAndUpdate(
      {
        userId,
      },
      {
        $set: {
          items: [],
        },
      },
    );

    return order;
  } catch (error) {
    await rollbackInventory(
      applied,
    );

    throw error;
  }
}

module.exports = {
  createOrder,
};
