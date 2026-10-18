const makeExercise = (
  id,
  name,
  bodyPart,
  target,
  equipment,
  imageUrl,
  imagePosition = "center",
  imageFit = "cover",
) => ({
  id: `shopora-${id}`,
  name,
  bodyPart,
  target,
  equipment,
  gifUrl: imageUrl,
  imageUrl,
  imagePosition,
  imageFit,
  videoUrl: null,
});

const EXERCISE_FALLBACKS = {
  chest: [
    makeExercise("chest-01", "Push-up", "chest", "pectorals", "body weight", "/exercises/push-up.jpg"),
    makeExercise("chest-02", "Incline push-up", "chest", "upper chest", "bench", "/exercises/incline-push-up.jpg"),
    makeExercise("chest-03", "Dumbbell bench press", "chest", "pectorals", "dumbbells", "/exercises/dumbbell-bench-press.jpg"),
    makeExercise("chest-04", "Dumbbell fly", "chest", "pectorals", "dumbbells", "/exercises/dumbbell-fly.jpg"),
    makeExercise("chest-05", "Standing cable press", "chest", "pectorals", "cable", "/exercises/standing-cable-press.jpg"),
  ],
  back: [
    makeExercise("back-01", "Bent-over row", "back", "upper back", "barbell", "/exercises/bent-over-row.jpg"),
    makeExercise("back-02", "Single-arm row", "back", "lats", "dumbbell", "/exercises/single-arm-row.jpg"),
    makeExercise("back-03", "Lat pulldown", "back", "lats", "cable", "/exercises/lat-pulldown.jpg"),
    makeExercise("back-04", "Seated cable row", "back", "mid back", "cable", "/exercises/seated-cable-row.jpg"),
    makeExercise("back-05", "Superman hold", "back", "lower back", "body weight", "/exercises/superman-hold.jpg"),
  ],
  arms: [
    makeExercise("arms-01", "Alternating biceps curl", "upper arms", "biceps", "dumbbells", "/exercises/alternating-biceps-curl.jpg"),
    makeExercise("arms-02", "Hammer curl", "upper arms", "biceps", "dumbbells", "/exercises/hammer-curl.jpg"),
    makeExercise("arms-03", "Triceps pressdown", "upper arms", "triceps", "cable", "/exercises/triceps-pressdown.jpg"),
    makeExercise("arms-04", "Overhead triceps extension", "upper arms", "triceps", "dumbbell", "/exercises/overhead-triceps-extension.jpg"),
    makeExercise("arms-05", "Wrist curl", "lower arms", "forearms", "dumbbells", "/exercises/wrist-curl.jpg"),
  ],
  legs: [
    makeExercise("legs-01", "Bodyweight squat", "upper legs", "quadriceps", "body weight", "/exercises/bodyweight-squat.jpg"),
    makeExercise("legs-02", "Reverse lunge", "upper legs", "glutes", "body weight", "/exercises/reverse-lunge.jpg"),
    makeExercise("legs-03", "Romanian deadlift", "upper legs", "hamstrings", "barbell", "/exercises/romanian-deadlift.jpg"),
    makeExercise("legs-04", "Glute bridge", "upper legs", "glutes", "body weight", "/exercises/glute-bridge.jpg"),
    makeExercise("legs-05", "Standing calf raise", "lower legs", "calves", "body weight", "/exercises/standing-calf-raise.jpg"),
  ],
  shoulders: [
    makeExercise("shoulders-01", "Dumbbell shoulder press", "shoulders", "deltoids", "dumbbells", "/exercises/dumbbell-shoulder-press.jpg"),
    makeExercise("shoulders-02", "Lateral raise", "shoulders", "lateral deltoids", "dumbbells", "/exercises/lateral-raise.jpg"),
    makeExercise("shoulders-03", "Front raise", "shoulders", "front deltoids", "dumbbells", "/exercises/front-raise.jpg"),
    makeExercise("shoulders-04", "Face pull", "shoulders", "rear deltoids", "cable", "/exercises/face-pull.jpg"),
    makeExercise("shoulders-05", "Pike push-up", "shoulders", "deltoids", "body weight", "/exercises/pike-push-up.webp", "center", "contain"),
  ],
  abs: [
    makeExercise("abs-01", "Forearm plank", "waist", "core", "body weight", "/exercises/forearm-plank.jpg"),
    makeExercise("abs-02", "Dead bug", "waist", "core", "body weight", "/exercises/dead-bug.jpg"),
    makeExercise("abs-03", "Bicycle crunch", "waist", "abdominals", "body weight", "/exercises/bicycle-crunch.jpg"),
    makeExercise("abs-04", "Hanging knee raise", "waist", "lower abdominals", "pull-up bar", "/exercises/hanging-knee-raise.jpg"),
    makeExercise("abs-05", "Russian twist", "waist", "obliques", "body weight", "/exercises/russian-twist.jpg"),
  ],
  cardio: [
    makeExercise("cardio-01", "Jumping jacks", "cardio", "cardiovascular system", "body weight", "/exercises/jumping-jacks.jpg"),
    makeExercise("cardio-02", "High knees", "cardio", "cardiovascular system", "body weight", "/exercises/high-knees.jpg"),
    makeExercise("cardio-03", "Mountain climber", "cardio", "cardiovascular system", "body weight", "/exercises/mountain-climber.jpg"),
    makeExercise("cardio-04", "Jump rope", "cardio", "cardiovascular system", "jump rope", "/exercises/jump-rope.jpg", "center 42%", "contain"),
    makeExercise("cardio-05", "Burpee", "cardio", "cardiovascular system", "body weight", "/exercises/burpee.jpg", "center 62%", "contain"),
  ],
};

function getFallbackExercises(category) {
  return (EXERCISE_FALLBACKS[category] || []).map((exercise) => ({ ...exercise }));
}

module.exports = { getFallbackExercises };
