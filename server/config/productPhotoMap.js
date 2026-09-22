const GROUPS = [
  { start: 1001, end: 1005, slug: "protein-powder" },
  { start: 1006, end: 1010, slug: "protein-bar" },
  { start: 1011, end: 1015, slug: "jump-rope" },
  { start: 1016, end: 1020, slug: "resistance-bands" },
  { start: 1021, end: 1025, slug: "fitness-tracker" },
  { start: 1026, end: 1030, slug: "yoga-mat" },
  { start: 1031, end: 1035, slug: "foam-roller" },
  { start: 1036, end: 1040, slug: "shaker-bottle" },
];

function getSeedProductImage(productId) {
  const id = Number(productId);
  const group = GROUPS.find((entry) => id >= entry.start && id <= entry.end);
  if (!group) return null;

  const index = id - group.start + 1;
  return `/products/real/${group.slug}-${index}.jpg`;
}

function getGeneratedProductFallback(productId) {
  const id = Number(productId);
  if (!Number.isInteger(id)) return null;
  return `/products/generated/${id}.svg`;
}

module.exports = {
  getSeedProductImage,
  getGeneratedProductFallback,
};
