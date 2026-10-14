import type { Example } from "@deutschgo/content-kit";

/** Renders a German example; highlighted token indices (e.g. the finite verb) are marked. */
export function GermanSentence({ example }: { example: Pick<Example, "de" | "highlight"> }) {
  const hl = new Set(example.highlight ?? []);
  const tokens = example.de.split(" ");
  return (
    <span lang="de" className="de">
      {tokens.map((tok, i) => (
        <span key={i}>
          {i > 0 ? " " : ""}
          {hl.has(i) ? <mark>{tok}</mark> : tok}
        </span>
      ))}
    </span>
  );
}
