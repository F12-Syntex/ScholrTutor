import type { StudentSummary } from "./generate";

export function StudentSummaryCard({ s }: { s: StudentSummary }) {
  const hasTopics = s.topicsCovered.length > 0;
  const hasTests = s.testResults.length > 0;
  const hasNotes = s.notes.length > 0;
  const hasRows = hasTopics || hasTests;

  return (
    <article className="overflow-hidden rounded-lg border border-border">
      <header className="bg-muted/80 px-5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-medium">{s.name}</h3>
            {s.reference && (
              <span className="font-mono text-xs text-muted-foreground">
                ({s.reference})
              </span>
            )}
          </div>
          {s.subject && (
            <span className="text-xs text-muted-foreground">{s.subject}</span>
          )}
        </div>
        {(s.currentGrade || s.predictedGrade || s.targetGrade) && (
          <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {s.currentGrade && (
              <span>
                Current:{" "}
                <span className="font-medium text-foreground">
                  {s.currentGrade}
                </span>
              </span>
            )}
            {s.predictedGrade && (
              <span>
                Predicted:{" "}
                <span className="font-medium text-foreground">
                  {s.predictedGrade}
                </span>
              </span>
            )}
            {s.targetGrade && (
              <span>
                Target:{" "}
                <span className="font-medium text-foreground">
                  {s.targetGrade}
                </span>
              </span>
            )}
          </div>
        )}
      </header>

      {hasRows && (
        <div className="overflow-x-auto bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="w-20 px-5 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Detail</th>
                <th className="w-28 px-5 py-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.topicsCovered.map((t, j) => (
                <tr key={`t-${j}`}>
                  <td className="px-5 py-2">
                    <span className="rounded bg-[color-mix(in_srgb,var(--mention-topic)_15%,transparent)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--mention-topic)]">
                      Topic
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">{t}</td>
                  <td className="px-5 py-2 text-right text-xs text-muted-foreground">
                    Covered
                  </td>
                </tr>
              ))}
              {s.testResults.map((r, j) => (
                <tr key={`r-${j}`}>
                  <td className="px-5 py-2">
                    <span className="rounded bg-info/15 px-1.5 py-0.5 text-[11px] font-medium text-info">
                      Test
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">{r.name}</td>
                  <td className="px-5 py-2 text-right">
                    <span className="text-sm font-medium tabular-nums">
                      {r.score}
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({r.percentage})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3 border-t border-border bg-card px-5 py-3">
        {hasNotes && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notes
            </p>
            <div className="space-y-1">
              {s.notes.map((n, j) => (
                <p
                  key={j}
                  className="border-l-2 border-border pl-2 text-xs text-muted-foreground"
                >
                  {n}
                </p>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm italic text-foreground/80">{s.overallComment}</p>
      </div>
    </article>
  );
}
