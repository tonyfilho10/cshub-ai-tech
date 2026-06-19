"use client";

import { useRef, useState } from "react";

export type MentionUser = { id: string; name: string };

type Props = {
  value: string;
  onChange: (val: string) => void;
  mentionableUsers: MentionUser[];
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function MentionTextarea({
  value,
  onChange,
  mentionableUsers,
  placeholder,
  rows = 2,
  autoFocus,
  className,
  onKeyDown,
}: Props) {
  const [query, setQuery] = useState<string | null>(null);
  const [atPos, setAtPos] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  const filtered =
    query === null
      ? []
      : mentionableUsers
          .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 7);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    const pos = e.target.selectionStart ?? val.length;
    const beforeCursor = val.slice(0, pos);
    const lastAt = beforeCursor.lastIndexOf("@");

    if (lastAt !== -1) {
      const afterAt = beforeCursor.slice(lastAt + 1);
      if (!afterAt.includes("\n") && !afterAt.includes("@")) {
        setQuery(afterAt);
        setAtPos(lastAt);
        setActiveIdx(0);
        onChange(val);
        return;
      }
    }

    setQuery(null);
    onChange(val);
  }

  function pick(user: MentionUser) {
    const before = value.slice(0, atPos);
    const after = value.slice(atPos + 1 + (query?.length ?? 0));
    const newVal = `${before}@${user.name} ${after}`;
    onChange(newVal);
    setQuery(null);
    setTimeout(() => {
      const cursor = before.length + user.name.length + 2;
      ref.current?.setSelectionRange(cursor, cursor);
      ref.current?.focus();
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (query !== null && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pick(filtered[activeIdx]);
        return;
      }
      if (e.key === "Escape") {
        setQuery(null);
        return;
      }
    }
    onKeyDown?.(e);
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />
      {query !== null && filtered.length > 0 && (
        <div className="absolute z-50 bottom-full mb-1 left-0 min-w-[180px] rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-card shadow-lg overflow-hidden">
          {filtered.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(user);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition ${
                i === activeIdx
                  ? "bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400"
                  : "text-navy-800 dark:text-foreground hover:bg-navy-50 dark:hover:bg-navy-800"
              }`}
            >
              @{user.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function renderWithMentions(content: string, users: MentionUser[]) {
  if (!users.length) return <span className="whitespace-pre-wrap">{content}</span>;

  const escaped = users.map((u) => u.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`@(${escaped.join("|")})`, "g");

  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(content)) !== null) {
    if (m.index > last) parts.push(content.slice(last, m.index));
    parts.push(
      <span key={m.index} className="text-accent-600 dark:text-accent-400 font-medium">
        @{m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push(content.slice(last));

  return <span className="whitespace-pre-wrap">{parts}</span>;
}
