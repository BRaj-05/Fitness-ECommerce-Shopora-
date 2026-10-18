const { z } = require('zod');

const userIdParamsSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

const productIdParamSchema = z.object({
  id: z.coerce.number().finite().int().positive('id must be a positive integer'),
});

const productIdSchema = z.coerce.number().finite().int().positive('productId must be a positive integer');
const quantitySchema = z.coerce.number().finite().int().positive('quantity must be a positive integer');
const nonNegativeNumberSchema = z.coerce.number().finite().min(0, 'must be zero or greater');
const nonNegativeIntegerSchema = z.coerce.number().finite().int().min(0, 'must be a non-negative integer');

const nullableNonNegativeNumberSchema = z
  .union([z.null(), nonNegativeNumberSchema])
  .optional();

const nullableNonNegativeIntegerSchema = z
  .union([z.null(), nonNegativeIntegerSchema])
  .optional();

const nullableStringSchema = z
  .union([z.string(), z.null()])
  .optional();

const cartItemSchema = z.object({
  productId: z.number({
    required_error: "productId is required",
    invalid_type_error: "Expected number, received string"
  }).int().positive(),

  quantity: z.number({
    required_error: "quantity is required",
    invalid_type_error: "Expected number, received string"
  }).int().min(1,{message: "Number must be greater than 0" }).max(99,{message: "Quantity cannot exceed 99" })
}).strict();

const productFieldsSchema = z.object({
  productId: productIdSchema,
  name: z.string().trim().min(1, 'name is required'),
  brand: z.string().optional(),
  category: z.string().optional(),
  type: z.string().trim().max(80).optional(),

  description: z
    .string()
    .trim()
    .max(2000)
    .optional(),

  highlights: z
    .array(z.string().trim().min(1).max(160))
    .max(8)
    .optional(),
  price: z.coerce.number().finite().positive('price must be a positive number'),
  originalPrice: nullableNonNegativeNumberSchema,
  rating: nonNegativeNumberSchema.optional(),
  reviews: nonNegativeIntegerSchema.optional(),
  badge: nullableStringSchema,
  image: z.string().optional(),
  imageSource: z.enum(["upload", "pexels", "url", "seed", "generated"]).optional(),
  imageCredit: z.object({
    provider: z.string().optional(),
    photographer: z.string().optional(),
    photographerUrl: z.string().url().optional().or(z.literal("")),
    sourceUrl: z.string().url().optional().or(z.literal("")),
    sourceId: z.string().optional(),
  }).optional(),
  fallbackImage: z.string().optional(),
  autoPhoto: z.boolean().optional(),
  stock: nullableNonNegativeIntegerSchema,
  reserved: nonNegativeIntegerSchema.optional(),
}).strict();

const productUpdateBodySchema = productFieldsSchema
  .partial()
  .refine(body => Object.keys(body).length > 0, {
    message: 'At least one product field is required',
  });

const workoutExerciseSchema = z.object({
  id: z.string().min(1, 'id is required'),
  name: z.string().min(1, 'name is required'),
  bodyPart: z.string().optional(),
  target: z.string().optional(),
  equipment: z.string().optional(),
  gifUrl: z.string().nullable().optional()
}).strict();

const workoutChecklistItemSchema = z.object({
  id: z.string().min(1, 'id is required'),
  text: z.string().trim().min(1, 'text is required').max(160, 'text is too long'),
  completed: z.boolean()
}).strict();

const workoutPlanSchema = z.object({
  name: z.string().trim().min(1, 'plan name is required'),
  focus: z.string().optional(),
  duration: z.string().optional(),
  durationWeeks: z.number().int().min(1).max(104),
  difficulty: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must use YYYY-MM-DD'),
  startedAt: z.string().datetime()
}).strict();

const workoutLogBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD'),
  title: z.string().optional(),
  notes: z.string().optional(),
  exercises: z.array(workoutExerciseSchema).optional(),
  checklist: z.array(workoutChecklistItemSchema).max(40).optional(),
  checkInAt: z.string().datetime().nullable().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
  plan: workoutPlanSchema.nullable().optional()
}).strict().refine(body => Object.keys(body).some(key => key !== 'date'), {
  message: 'At least one workout field is required',
});

module.exports = {
  cartAddSchema: {
    params: userIdParamsSchema,
    body: cartItemSchema,
  },
  cartRemoveSchema: {
    params: userIdParamsSchema,
    body: cartItemSchema,
  },
  createOrderSchema: {
    body: z.object({
      userId: z.string().min(1, 'userId is required'),
      items: z.array(cartItemSchema).optional(),
    }).strict(),
  },
  createProductSchema: {
    body: productFieldsSchema,
  },
  updateProductSchema: {
    params: productIdParamSchema,
    body: productUpdateBodySchema,
  },
  updateWorkoutLogSchema: {
    body: workoutLogBodySchema,
  },
};
