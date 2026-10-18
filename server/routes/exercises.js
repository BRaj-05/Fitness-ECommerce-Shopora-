const express = require("express");
const { getFallbackExercises } = require("../data/exerciseFallbackCatalog");

const router = express.Router();
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "exercisedb.p.rapidapi.com";
const CACHE_TTL_MS = 30 * 60 * 1000;
const exerciseCache = new Map();

const CATEGORY_MAPPING = {
  chest: ["chest"],
  back: ["back"],
  shoulders: ["shoulders"],
  cardio: ["cardio"],
  abs: ["waist"],
  arms: ["upper arms", "lower arms"],
  legs: ["upper legs", "lower legs"],
};

async function fetchExercisesFromAPI(bodyPart, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=24&offset=0`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Exercise provider returned ${response.status}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.exercises)) return payload.exercises;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeExercise(exercise) {
  return {
    id: String(exercise.id || exercise.exerciseId || exercise.name),
    name: exercise.name || "Movement",
    bodyPart: exercise.bodyPart || "",
    target: exercise.target || "",
    equipment: exercise.equipment || "",
    gifUrl: exercise.gifUrl || exercise.image || exercise.imageUrl || null,
    imageUrl: exercise.image || exercise.imageUrl || null,
    videoUrl: exercise.videoUrl || null,
  };
}

function deduplicateExercises(exercises) {
  const seen = new Set();
  return exercises.filter((exercise) => {
    if (!exercise.id || seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

function cacheExercises(category, exercises) {
  exerciseCache.set(category, { exercises, expiresAt: Date.now() + CACHE_TTL_MS });
  return exercises;
}

router.get("/:category", async (req, res) => {
  const category = String(req.params.category || "").toLowerCase();
  const bodyParts = CATEGORY_MAPPING[category];

  if (!bodyParts) {
    return res.status(400).json({
      error: `Invalid category. Supported: ${Object.keys(CATEGORY_MAPPING).join(", ")}`,
    });
  }

  const cached = exerciseCache.get(category);
  if (cached?.expiresAt > Date.now()) {
    return res.json(cached.exercises);
  }

  const fallback = getFallbackExercises(category);
  const apiKey = process.env.RAPIDAPI_KEY?.trim();
  if (!apiKey) {
    return res.json(cacheExercises(category, fallback));
  }

  try {
    const results = await Promise.allSettled(
      bodyParts.map((bodyPart) => fetchExercisesFromAPI(bodyPart, apiKey)),
    );
    const remoteExercises = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    const normalized = deduplicateExercises(remoteExercises.map(normalizeExercise));

    return res.json(cacheExercises(category, normalized.length ? normalized : fallback));
  } catch (error) {
    console.warn(`Exercise provider unavailable for ${category}: ${error.message}`);
    return res.json(cacheExercises(category, fallback));
  }
});

module.exports = router;
