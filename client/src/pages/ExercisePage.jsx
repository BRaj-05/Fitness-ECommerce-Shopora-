import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { addExerciseToWorkout } from "../utils/workoutStorage";
import ShoporaLoader from "../components/ShoporaLoader";
import SiteFooter from "../components/SiteFooter";
import { AlertTriangle, ArrowLeft, CalendarDays, Dumbbell, Layers3, Search } from "lucide-react";

const CATEGORIES = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "arms", name: "Arms" },
  { id: "legs", name: "Legs" },
  { id: "shoulders", name: "Shoulders" },
  { id: "abs", name: "Abs" },
  { id: "cardio", name: "Cardio" },
];

export default function ExercisePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const suggestedCategory = location.state?.suggestedCategory || "chest";
  const [selectedCategory, setSelectedCategory] = useState(suggestedCategory);

  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    if (a.id === suggestedCategory) return -1;
    if (b.id === suggestedCategory) return 1;
    return 0;
  });
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [imageErrors, setImageErrors] = useState(new Set());
  const [query, setQuery] = useState("");
  const requestIdRef = useRef(0);

  const filteredExercises = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;
    return exercises.filter((exercise) => [exercise.name, exercise.target, exercise.equipment, exercise.bodyPart]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized));
  }, [exercises, query]);
  const activeCategory = CATEGORIES.find((category) => category.id === selectedCategory);
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    : "No day selected";

  // Get selected date from localStorage on mount
  useEffect(() => {
    const storedDate = localStorage.getItem("selectedDate");
    if (storedDate) {
      setSelectedDate(storedDate);
    }
  }, []);

  // Fetch exercises when category changes
  useEffect(() => {
    fetchExercises(selectedCategory);
  }, [selectedCategory]);

  const fetchExercises = async (bodyPart) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    setExercises([]);
    setImageErrors(new Set());

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/exercises/${bodyPart}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch exercises. Status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Exercise library returned an invalid response.");
      }
      if (requestId === requestIdRef.current) setExercises(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load exercises. Please try again.");
      console.error("Exercise fetch error:", err);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const handleExerciseSelect = async (exercise) => {
    if (!selectedDate) {
      alert("No date selected. Please go back and select a date first.");
      return;
    }

    // Add exercise to the workout
    await addExerciseToWorkout(selectedDate, exercise);

    // Navigate back to notes page
    localStorage.setItem("selectedDate", selectedDate);
    navigate("/notes");
  };

  const handleImageError = (exerciseId) => {
    console.warn(`[Exercise Client] Image failed to load for exercise ID: ${exerciseId}`);
    setImageErrors((prev) => new Set([...prev, exerciseId]));
  };

  const handleBack = () => {
    navigate("/notes");
  };

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] font-sans text-[var(--lux-ink)]">
      <Navbar variant="product" />

      <main className="shopora-wide-shell exercise-page-shell py-10 sm:py-14 lg:py-16">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-10 flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--lux-muted)] transition-colors hover:text-[var(--lux-ink)]"
        >
          <ArrowLeft size={15} /> Back to workout
        </button>

        <header className="exercise-library-hero">
          <div className="exercise-library-copy">
            <p className="lux-eyebrow">EXERCISE LIBRARY</p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">Choose your movement.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted)]">Filter by body area, inspect equipment and add the right exercise to your selected training day.</p>
          </div>
          <div className="exercise-library-utility">
            <div className="exercise-library-stats" aria-label="Exercise library summary">
              <div><strong>{String(filteredExercises.length).padStart(2, "0")}</strong><span>Movements</span></div>
              <div><strong>{String(CATEGORIES.findIndex((category) => category.id === selectedCategory) + 1).padStart(2, "0")}</strong><span>Focus index</span></div>
              <div><strong>{selectedDate ? "Ready" : "Plan"}</strong><span>{selectedDateLabel}</span></div>
            </div>
            <label className="relative block">
              <span className="sr-only">Search exercises</span>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--lux-muted)]" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movement, target or equipment" className="h-12 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] pl-12 pr-4 text-sm outline-none focus:border-[var(--lux-violet)]" />
            </label>
          </div>
        </header>

        <div className="exercise-catalog-layout">
          <aside className="exercise-category-panel" aria-label="Exercise focus">
            <div className="exercise-category-heading">
              <p className="lux-eyebrow">TRAINING FOCUS</p>
              <Layers3 size={18} aria-hidden="true" />
            </div>
            <div className="exercise-category-list">
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id}
                className={`exercise-category-button
                  ${selectedCategory === cat.id
                    ? "exercise-category-button-active"
                    : ""
                  }`}
              >
                <span>{cat.name}</span>
                <span>{String(CATEGORIES.findIndex((category) => category.id === cat.id) + 1).padStart(2, "0")}</span>
              </button>
            ))}
            </div>
            <div className="exercise-date-note">
              <CalendarDays size={17} aria-hidden="true" />
              <div><span>Training day</span><strong>{selectedDateLabel}</strong></div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="exercise-results-heading">
              <div>
                <p className="lux-eyebrow">CURRENT COLLECTION</p>
                <h2>{activeCategory?.name || "Exercises"}</h2>
              </div>
              <p>{filteredExercises.length} curated movements</p>
            </div>

        {/* Exercises Grid */}
        {loading && (
          <section className="exercise-grid" aria-label="Loading exercises">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="shopora-skeleton aspect-[4/5] rounded-2xl" />)}
            <ShoporaLoader label="Loading exercises" className="sr-only" />
          </section>
        )}

        {error && (
          <section className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-[var(--lux-line)] bg-[var(--lux-surface)]">
            <div className="text-center p-8">
              <AlertTriangle className="mx-auto mb-4 text-[var(--lux-orange)]" size={32} />
              <p className="text-sm font-bold text-[var(--lux-ink)]">
                {error}
              </p>
              <button
                onClick={() => fetchExercises(selectedCategory)}
                className="shopora-btn shopora-btn-primary mt-6"
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {!loading && !error && exercises.length === 0 && (
          <section className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--lux-line)] bg-[var(--lux-surface)]">
            <div className="text-center p-8">
              <Dumbbell className="mx-auto mb-4 text-[var(--lux-muted)]" size={32} />
              <p className="text-sm font-bold text-[var(--lux-ink)]">
                No exercises found
              </p>
              <p className="mt-2 text-xs text-[var(--lux-muted)]">Try selecting a different category.</p>
            </div>
          </section>
        )}

        {!loading && !error && exercises.length > 0 && filteredExercises.length === 0 && (
          <section className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-[var(--lux-line)] bg-[var(--lux-surface)]">
            <div className="p-8 text-center">
              <Search className="mx-auto mb-4 text-[var(--lux-muted)]" size={30} />
              <h2 className="font-heading text-xl font-extrabold">No matching movements</h2>
              <p className="mt-2 text-sm text-[var(--lux-muted)]">Try a muscle, movement or equipment name.</p>
              <button type="button" onClick={() => setQuery("")} className="shopora-btn shopora-btn-secondary mt-5">Clear search</button>
            </div>
          </section>
        )}

        {!loading && !error && filteredExercises.length > 0 && (
          <section className="exercise-grid">
            {filteredExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`lux-product-card exercise-card group flex flex-col overflow-hidden ${index === 0 ? "exercise-card-featured" : ""}`}
              >
                {/* Exercise Media Container */}
                <div className="exercise-card-media relative flex w-full items-center justify-center overflow-hidden bg-[var(--lux-soft)]">
                  {(exercise.imageUrl || exercise.gifUrl)?.trim() && !imageErrors.has(exercise.id) ? (
                    <>
                      {exercise.imageFit === "contain" && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-[-12px] scale-110 bg-cover bg-center opacity-20 blur-xl"
                          style={{ backgroundImage: `url(${exercise.imageUrl || exercise.gifUrl})` }}
                        />
                      )}
                      <img
                        src={exercise.imageUrl || exercise.gifUrl}
                        alt={`${exercise.name} exercise demonstration`}
                        loading="lazy"
                        decoding="async"
                        style={{ objectPosition: exercise.imagePosition || "center" }}
                        className={`relative h-full w-full transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none ${exercise.imageFit === "contain" ? "object-contain" : "object-cover"}`}
                        onError={() => handleImageError(exercise.id)}
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--lux-soft)] transition-colors">
                      <div className="text-center">
                        <Dumbbell className="mx-auto mb-3 text-[var(--lux-muted)]" size={30} />
                        <p className="text-xs font-bold text-[var(--lux-muted)]">
                          {exercise.bodyPart || selectedCategory} movement
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exercise Details */}
                <div className="exercise-card-body p-5 md:p-6 flex flex-col grow">
                  <h3 className="mb-2 line-clamp-2 font-heading text-lg font-extrabold capitalize text-[var(--lux-ink)] md:text-xl">
                    {exercise.name}
                  </h3>

                  <div className="mb-5 grow space-y-2 text-xs text-[var(--lux-muted)]">
                    {exercise.target && (
                      <p>
                        <span className="uppercase tracking-wide">Target:</span>{" "}
                        <span className="capitalize text-[var(--lux-ink)]">{exercise.target}</span>
                      </p>
                    )}
                    {exercise.equipment && (
                      <p>
                        <span className="uppercase tracking-wide">Equipment:</span>{" "}
                        <span className="capitalize text-[var(--lux-ink)]">{exercise.equipment}</span>
                      </p>
                    )}
                    {exercise.bodyPart && (
                      <p>
                        <span className="uppercase tracking-wide">Body Part:</span>{" "}
                        <span className="capitalize text-[var(--lux-ink)]">{exercise.bodyPart}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleExerciseSelect(exercise)}
                    className="shopora-btn shopora-btn-primary w-full"
                  >
                    Add to workout
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
