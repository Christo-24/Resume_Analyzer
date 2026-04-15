function Result({ result }) {
  if (!result) return null;

  const normalizeArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      return value
        .split(/\n|,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const scoreSource = result.scores || result.score || result.ats_scores || {};
  const scores = {
    overall: scoreSource.overall ?? scoreSource.total ?? result.overall_score,
    work_experience: scoreSource.work_experience ?? scoreSource.experience,
    education: scoreSource.education,
    skills: scoreSource.skills,
    formatting: scoreSource.formatting ?? scoreSource.presentation,
  };

  const overallScore = Number(scores.overall || 0);

  const missingSource =
    result.missing_skills ||
    result.missingSkills ||
    result.skill_gaps ||
    result.skillGaps ||
    {};

  const missingCritical = normalizeArray(
    missingSource.critical || missingSource.must_have || missingSource.required
  );

  const missingRecommended = normalizeArray(
    missingSource.recommended || missingSource.good_to_have || missingSource.optional
  );

  const suggestionSource = result.suggestions || result.recommendations || result.improvements || [];
  const suggestions = Array.isArray(suggestionSource)
    ? suggestionSource
        .map((item) => {
          if (typeof item === "string") {
            return { section: "General", issue: item, fix: "Update the resume accordingly." };
          }

          return {
            section: item.section || item.category || "General",
            issue: item.issue || item.problem || item.gap || "No issue details provided.",
            fix: item.fix || item.solution || item.recommendation || "No fix provided.",
          };
        })
        .filter(Boolean)
    : [];

  const scoreItems = [
    { label: "Work Experience", value: scores.work_experience },
    { label: "Education", value: scores.education },
    { label: "Skills", value: scores.skills },
    { label: "Formatting", value: scores.formatting },
  ].filter((item) => item.value !== undefined && item.value !== null);

  const getScoreColor = (value) => {
    if (value >= 80) return "bg-emerald-500";
    if (value >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  if (result.error) {
    return (
      <div className="mt-7 rounded-2xl border border-rose-300 bg-linear-to-br from-rose-50 to-orange-50 p-5 text-rose-700 shadow-sm">
        <h2 className="text-lg font-semibold">Analysis Error</h2>
        <p className="mt-2 text-sm leading-relaxed">{result.error}</p>
        {result.raw_response && (
          <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700">
            {result.raw_response}
          </pre>
        )}
      </div>
    );
  }

  return (
    <section className="mt-7 space-y-6 rounded-3xl border border-cyan-100 bg-linear-to-b from-white to-cyan-50/40 p-5 shadow-[0_14px_40px_-24px_rgba(8,47,73,0.45)] sm:p-6">
      <div>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold tracking-tight text-cyan-900 sm:text-xl">Overall Score</h2>
          <span className="text-3xl font-black tracking-tight text-slate-900">{overallScore}%</span>
        </div>
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-3.5 rounded-full ${getScoreColor(overallScore)}`}
            style={{ width: `${Math.max(0, Math.min(100, overallScore))}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {scoreItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold text-sky-900">{item.label}</p>
              <p className="text-sm font-bold text-slate-900">{item.value}%</p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-2.5 rounded-full ${getScoreColor(Number(item.value))}`}
                style={{ width: `${Math.max(0, Math.min(100, Number(item.value)))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold tracking-tight text-cyan-900 sm:text-lg">Missing Skills</h3>

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-700">Critical</p>
          <div className="flex flex-wrap gap-2">
            {missingCritical.length ? (
              missingCritical.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-full border border-rose-300 bg-linear-to-r from-rose-100 to-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No critical skills missing.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-700">Recommended</p>
          <div className="flex flex-wrap gap-2">
            {missingRecommended.length ? (
              missingRecommended.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-full border border-amber-300 bg-linear-to-r from-amber-100 to-yellow-50 px-3 py-1 text-xs font-semibold text-amber-700"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recommended skills missing.</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold tracking-tight text-cyan-900 sm:text-lg">Suggestions</h3>
        <div className="space-y-3">
          {suggestions.length ? (
            suggestions.map((suggestion, index) => (
              <article key={index} className="rounded-2xl border border-cyan-100 bg-linear-to-b from-white to-sky-50 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">{suggestion.section || "General"}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{suggestion.issue}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  <span className="font-medium">Fix:</span> {suggestion.fix}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No suggestions available.</p>
          )}
        </div>
      </div>
    </section>
  );
}
export default Result;