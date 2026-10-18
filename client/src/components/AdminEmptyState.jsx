import { createElement } from "react";
import { Inbox } from "lucide-react";

export default function AdminEmptyState({ icon: Icon = Inbox, title = "Nothing here yet", hint }) {
  return <div className="grid min-h-40 place-items-center px-5 py-10 text-center"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--lux-soft)] text-[var(--lux-muted)]">{createElement(Icon, { size: 20 })}</span><p className="mt-4 text-sm font-bold text-[var(--lux-ink)]">{title}</p>{hint && <p className="mt-1 text-xs text-[var(--lux-muted)]">{hint}</p>}</div></div>;
}
