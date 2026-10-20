import type { MessageKey } from "@deutschgo/i18n";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { AccountPanel, type AccountLabels } from "../../../components/AccountPanel";
import { ProfilePanel } from "../../../components/ProfilePanel";
import { ProgressPanel } from "../../../components/ProgressPanel";
import { bundle } from "../../../lib/content";
import { ui } from "../../../lib/i18n";

/** Every catalog string the account area shows. Kept here so the client gets plain text. */
const ACCOUNT_KEYS: MessageKey[] = [
  "account.title", "account.lead", "account.age", "account.google", "account.apple",
  "account.signedIn", "account.signedInAs", "account.signOut", "account.savedNote",
  "account.notSavedNote", "account.unavailable", "account.deleteTitle", "account.deleteConfirm",
  "account.delete",
  "account.notice.signedIn", "account.notice.signedOut", "account.notice.deleted",
  "account.notice.unavailable", "account.notice.age", "account.notice.provider",
  "account.notice.failed", "account.notice.confirm", "account.notice.deleteUnavailable",
  "account.notice.ageNotRecorded",
];

/** The ?auth= values the auth routes redirect with, mapped to their message keys. */
const NOTICES: Record<string, MessageKey> = {
  "signed-in": "account.notice.signedIn",
  "signed-out": "account.notice.signedOut",
  deleted: "account.notice.deleted",
  unavailable: "account.notice.unavailable",
  age: "account.notice.age",
  provider: "account.notice.provider",
  failed: "account.notice.failed",
  confirm: "account.notice.confirm",
  "delete-unavailable": "account.notice.deleteUnavailable",
  "age-not-recorded": "account.notice.ageNotRecorded",
};

export default async function You({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const b = bundle();

  const text: Record<string, string> = {};
  for (const key of ACCOUNT_KEYS) {
    // The email is substituted on the client, so the placeholder is kept literally here.
    text[key] = key === "account.signedInAs" ? msg(key, { email: "{email}" }) : msg(key);
  }
  const labels: AccountLabels = {
    text,
    notices: NOTICES,
  };

  return (
    <main className="page">
      <h1>{msg("profile.title")}</h1>
      <ProgressPanel lang={lang} graph={graphFromBundle(b)} totalTopics={b.concepts.length} />
      <section className="panel" aria-labelledby="account-heading">
        <h2 id="account-heading">{msg("account.title")}</h2>
        <AccountPanel lang={lang} labels={labels} />
      </section>
      <ProfilePanel lang={lang} />
    </main>
  );
}
