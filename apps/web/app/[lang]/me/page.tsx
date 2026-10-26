import Link from "next/link";
import type { MessageKey } from "@deutschgo/i18n";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { AccountPanel, type AccountLabels } from "../../../components/AccountPanel";
import { Icon } from "../../../components/Icon";
import { ProfileHero } from "../../../components/Motivation";
import { ProfileDevice, ProfileSettings } from "../../../components/ProfilePanel";
import { Reminders, type ReminderLabels } from "../../../components/Reminders";
import { ProgressPanel } from "../../../components/ProgressPanel";
import { bundle } from "../../../lib/content";
import { ui } from "../../../lib/i18n";
import { coursePathCounts } from "../../../lib/course-paths";

/** Every catalog string the account area shows. Kept here so the client gets plain text. */
const ACCOUNT_KEYS: MessageKey[] = [
  "account.title", "account.lead", "account.age", "account.google", "account.apple",
  "account.signedIn", "account.signedInAs", "account.signOut", "account.savedNote",
  "account.importTitle", "account.importBody", "account.importAction", "account.importing", "account.importDone", "account.importFailed", "account.importLegacy", "account.exportAction", "account.exportFailed",
  "account.notSavedNote", "account.unavailable", "account.deleteTitle", "account.deleteConfirm",
  "account.delete", "account.testLogin", "account.testLoginNote",
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
    text[key] = key === "account.signedInAs" ? msg(key, { email: "{email}" }) : ["account.importBody", "account.importAction", "account.importDone", "account.importLegacy"].includes(key) ? msg(key, { count: "{count}" }) : msg(key);
  }
  const reminderLabels: ReminderLabels = {
    lead: msg("reminders.lead"),
    on: msg("reminders.on"),
    off: msg("reminders.off"),
    enable: msg("reminders.enable"),
    disable: msg("reminders.disable"),
    needSignIn: msg("reminders.needSignIn"),
    unsupported: msg("reminders.unsupported"),
    blocked: msg("reminders.blocked"),
    notConfigured: msg("reminders.notConfigured"),
    failed: msg("reminders.failed"),
  };
  const labels: AccountLabels = {
    text,
    notices: NOTICES,
  };

  return (
    <main className="page profile">
      <ProfileHero lang={lang} />
      <section className="profile-progress">
        <ProgressPanel lang={lang} graph={graphFromBundle(b)} totalTopics={b.concepts.length} />
        <Link className="btn btn-secondary" href={"/" + lang + "/progress"}>{msg("progress.title")}</Link>
      </section>
      <ProfileSettings lang={lang} coursePaths={coursePathCounts(b.units.length)} />
      <section className="card" aria-labelledby="reminder-heading">
        <h2 id="reminder-heading" className="card-title">
          <Icon name="bell" size={20} />
          {msg("reminders.title")}
        </h2>
        <Reminders lang={lang} labels={reminderLabels} />
      </section>
      <section className="card" aria-labelledby="account-heading">
        <h2 id="account-heading" className="card-title">
          <Icon name="user" size={20} />
          {msg("account.title")}
        </h2>
        <AccountPanel lang={lang} labels={labels} />
      </section>
      <ProfileDevice lang={lang} />
    </main>
  );
}
