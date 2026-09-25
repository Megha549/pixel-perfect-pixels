const KEYWORDS =
  /\b(select|from|where|left join|right join|inner join|join|on|group by|having|order by|limit|and|or|not exists|not in|exists|is null|is not null|coalesce|sum|count|avg|as|desc|asc|interval|now)\b/gi;

export function SqlHighlight({ code }: { code: string }) {
  const html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/--([^\n]*)/g, '<span class="text-white/40">--$1</span>')
    .replace(/'([^']*)'/g, "<span class=\"text-accent\">'$1'</span>")
    .replace(KEYWORDS, '<span class="text-accent">$1</span>');

  return (
    <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

export function SqlEditor({
  value,
  onChange,
  filename = "query.sql",
  readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  filename?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-ink/95 shadow-lg">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="size-2.5 rounded-full bg-rose-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-[11px] text-slate-400">{filename}</span>
      </div>
      {readOnly ? (
        <SqlHighlight code={value} />
      ) : (
        <textarea
          spellCheck={false}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={8}
          className="w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
          placeholder="-- write your query here"
        />
      )}
    </div>
  );
}
