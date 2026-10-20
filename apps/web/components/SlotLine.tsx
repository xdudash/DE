import type { Example } from "@deutschgo/content-kit";

/**
 * One German sentence split at its finite verb into the three slots the V2 rule is
 * about: whatever comes first, the verb in position 2, and the rest.
 *
 * Every word here comes from the content bundle — the sentence, the caption and the
 * gloss — so no teaching text lives in this component. If the example does not mark
 * exactly one finite verb away from the start, there is nothing truthful to show and
 * the component renders nothing.
 */
export function SlotLine({
  example,
  caption,
  gloss,
}: {
  example: Pick<Example, "de" | "highlight">;
  caption: string;
  gloss?: string;
}) {
  const index = example.highlight?.length === 1 ? example.highlight[0]! : -1;
  const tokens = example.de.split(" ");
  if (index < 1 || index >= tokens.length) return null;

  const first = tokens.slice(0, index).join(" ");
  const verb = tokens[index]!;
  const rest = tokens.slice(index + 1).join(" ");

  return (
    <figure className="slotline">
      <ol>
        <li>
          <span className="pos">1</span>
          <span className="word" lang="de">{first}</span>
        </li>
        <li className="verb">
          <span className="pos">2</span>
          <span className="word" lang="de">{verb}</span>
        </li>
        {rest && (
          <li>
            <span className="pos" aria-hidden="true" />
            <span className="word" lang="de">{rest}</span>
          </li>
        )}
      </ol>
      <figcaption>
        <span className="label">{caption}</span>
        {gloss && <span className="gloss">{gloss}</span>}
      </figcaption>
    </figure>
  );
}
