/**
 * Minimal, safe Markdown subset for authored explanations: paragraphs, "- " lists,
 * **bold**, *italic* (nestable). No raw HTML is ever rendered.
 */
import type { ReactNode } from "react";

export function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const parts = text.split(/(\*\*|\*)/);
  type Frame = { marker: string; children: ReactNode[] };
  const stack: Frame[] = [{ marker: "", children: [] }];
  let k = 0;
  for (const part of parts) {
    if (part === "**" || part === "*") {
      const top = stack[stack.length - 1]!;
      if (top.marker === part && stack.length > 1) {
        stack.pop();
        const el = part === "**" ? <strong key={`${keyPrefix}${k++}`}>{top.children}</strong> : <em key={`${keyPrefix}${k++}`}>{top.children}</em>;
        stack[stack.length - 1]!.children.push(el);
      } else {
        stack.push({ marker: part, children: [] });
      }
    } else if (part) {
      stack[stack.length - 1]!.children.push(part);
    }
  }
  // Unclosed markers are rendered literally rather than dropped.
  while (stack.length > 1) {
    const f = stack.pop()!;
    stack[stack.length - 1]!.children.push(f.marker, ...f.children);
  }
  return stack[0]!.children;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length && lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => <li key={li}>{inline(l.slice(2), `b${bi}l${li}`)}</li>)}
            </ul>
          );
        }
        return <p key={bi}>{inline(lines.join(" "), `b${bi}`)}</p>;
      })}
    </>
  );
}
