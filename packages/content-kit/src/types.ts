/**
 * DeutschGo content contract, schema family v1.
 * Canonical definitions: packages/content-kit/schemas/*.schema.json
 * Human documentation:  docs/domain/CONTENT_CONTRACT.md
 *
 * A string starting with "@" is a localization key resolved per explanation
 * language from content/i18n/<lang>/<entity-id>.yaml. All other strings in
 * German fields (`de`, `tokens`, `accept`, ...) are canonical German.
 */

export type L10nRef = `@${string}`;
export type Cefr = "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** Editorial lifecycle of a canonical entity. */
export type ContentStatus =
  | "planned" // graph placeholder: id, title, summary, CEFR, relations only
  | "draft"
  | "needs_review"
  | "approved"
  | "published"
  | "deprecated";

/** Lifecycle of a translation file, independent of the canonical entity. */
export type L10nStatus = "machine_draft" | "draft" | "needs_review" | "reviewed";

export type ReviewGate = "pending" | "passed" | "changes_requested" | "not_applicable";

export interface ReviewRecord {
  status: ReviewGate;
  reviewer?: string;
  date?: string;
  notes?: string;
}

export interface Review {
  linguistic: ReviewRecord;
  pedagogical: ReviewRecord;
  rights: ReviewRecord;
}

export type Variety = "standard" | "de-DE" | "de-AT" | "de-CH" | "south" | "north";
export type Register = "neutral" | "formal" | "informal" | "colloquial" | "written" | "dated";

export type RelationType =
  | "depends_on" // canonical prerequisite direction: this -> target must be known first
  | "related_to"
  | "contrasts_with"
  | "commonly_confused_with"
  | "part_of";

export interface Relation {
  type: RelationType;
  target: string;
  note?: L10nRef;
}

export interface Example {
  id: string;
  de: string;
  /** Translation/gloss in explanation language. */
  gloss?: L10nRef;
  note?: L10nRef;
  /** Space-separated token indices (0-based) to highlight, e.g. the finite verb. */
  highlight?: number[];
  variety?: Variety;
  register?: Register;
  source?: string;
}

export interface Confusion {
  id: string;
  wrong: string;
  right: string;
  explanation: L10nRef;
}

export interface SourceUse {
  source: string;
  scope?: string;
}

export interface Concept {
  schema: "deutschgo.concept/1";
  id: string;
  version: string;
  status: ContentStatus;
  kind: "grammar" | "morphology" | "lexeme_sense" | "collocation" | "pronunciation" | "orthography" | "pragmatics" | "discourse" | "regional";
  domain: string;
  title: L10nRef;
  summary: L10nRef;
  cefr: { introduced: Cefr; expected_mastery?: Cefr };
  relations?: Relation[];
  variety?: Variety[];
  register?: Register;
  /** Canonical German-facing description of the pattern. */
  pattern?: { schema_de: string; scope: L10nRef; limits?: L10nRef };
  examples?: Example[];
  confusions?: Confusion[];
  sources?: SourceUse[];
  review?: Review;
}

export interface Objective {
  id: string;
  text: L10nRef;
  skill: "knowledge" | "reading" | "listening" | "writing" | "speaking";
}

export interface FeedbackRule {
  /** Exact match after normalization. */
  match: string[];
  feedback: L10nRef;
  /** Optional concept this mistake signals (for diagnostics). */
  signals?: string;
}

interface ExerciseBase {
  id: string;
  objective: string;
  concepts: string[];
  prompt: L10nRef;
  difficulty: 1 | 2 | 3;
  feedback: { correct: L10nRef; incorrect: L10nRef; rules?: FeedbackRule[] };
  explanation: L10nRef;
}

export interface SingleChoiceExercise extends ExerciseBase {
  type: "single_choice";
  stem_de?: string;
  options: { id: string; de?: string; text?: L10nRef; correct: boolean; feedback?: L10nRef }[];
}

export interface MultiChoiceExercise extends ExerciseBase {
  type: "multi_choice";
  stem_de?: string;
  /** Two or more options may be correct; the learner must pick exactly the correct set. */
  options: { id: string; de?: string; text?: L10nRef; correct: boolean; feedback?: L10nRef }[];
}

export interface WordOrderExercise extends ExerciseBase {
  type: "word_order";
  /** Chunks presented to the learner in this (shuffled-for-display) order. */
  tokens: string[];
  /** Accepted full sentences built from exactly these tokens. */
  accept: string[];
  /** Punctuation appended to the assembled sentence. */
  final_punctuation: "." | "?" | "!";
}

export interface ClozeExercise extends ExerciseBase {
  type: "cloze";
  /** German text with gaps as {{0}}, {{1}}, ... */
  text_de: string;
  gaps: { accept: string[]; rules?: FeedbackRule[]; hint?: L10nRef }[];
}

export interface KeywordBuildExercise extends ExerciseBase {
  type: "keyword_build";
  /** German prompt words the learner must use to build a complete sentence. */
  keywords: string[];
  /** Accepted complete German sentences using every keyword. */
  accept: string[];
}

export interface TokenBankBuildExercise extends ExerciseBase {
  type: "token_bank_build";
  /** German word chunks; each token can be used at most once. */
  tokens: string[];
  /** Correct token-index sequences. A sequence may leave distractor tokens unused. */
  solutions: number[][];
  final_punctuation: "." | "?" | "!";
}

export interface VerbPositionExercise extends ExerciseBase {
  type: "verb_position";
  /** German sentence chunks; the learner marks the finite verb. */
  tokens: string[];
  finite_verb_index: number;
}

export interface TransformExercise extends ExerciseBase {
  type: "transform";
  source_de: string;
  accept: string[];
}

export interface SeparableVerbExercise extends ExerciseBase {
  type: "separable_verb";
  source_de: string;
  finite_form_de: string;
  prefix_de: string;
  accept: string[];
}

export interface NegationExercise extends ExerciseBase {
  type: "negation";
  /** Positive German sentence to rewrite with a correct negation. */
  source_de: string;
  /** Accepted German negations, typically using nicht or a declined form of kein. */
  accept: string[];
}

export interface ConnectorChoiceExercise extends ExerciseBase {
  type: "connector_choice";
  before_de: string;
  after_de: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface CaseChoiceExercise extends ExerciseBase {
  type: "case_choice";
  before_de: string;
  after_de: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface PrepositionChoiceExercise extends ExerciseBase {
  type: "preposition_choice";
  before_de: string;
  after_de: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface ReadQuestionExercise extends ExerciseBase {
  type: "read_question";
  text_de: string;
  question_de: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface DialogueGapExercise extends ExerciseBase {
  type: "dialogue_gap";
  lines: ({ speaker: "a" | "b"; text_de: string } | { speaker: "a" | "b"; accept: string[] })[];
}

export interface ModalChoiceExercise extends ExerciseBase {
  type: "modal_choice";
  before_de: string;
  after_de: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface OddOneOutExercise extends ExerciseBase {
  type: "odd_one_out";
  stem_de?: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface FlashcardRecallExercise extends ExerciseBase {
  type: "flashcard_recall";
  front: L10nRef;
  back_de: string;
  example_de?: string;
}

export interface TranslationInputExercise extends ExerciseBase {
  type: "translation_input";
  front: L10nRef;
  accept: string[];
}

/** Free-text answers checked against an accepted list (ADR-0023 batch 1). */
export type TextInputType = "article_input" | "form_input" | "gap_fill_input" | "spelling_input" | "number_input" | "time_input";

export interface TextInputExercise extends ExerciseBase {
  type: TextInputType;
  stem_de?: string;
  /** Accepted answers, compared with the usual normalisation. Never empty. */
  accept: string[];
}

export interface TrueFalseExercise extends ExerciseBase {
  type: "true_false";
  statement_de: string;
  correct: boolean;
  /** Shown when the learner picks the wrong value. */
  wrong_feedback?: L10nRef;
}

export interface MatchPairsExercise extends ExerciseBase {
  type: "match_pairs";
  pairs: { id: string; left_de: string; right_de: string }[];
}

export interface CategorizeExercise extends ExerciseBase {
  type: "categorize";
  categories: { id: string; label: L10nRef }[];
  items: { id: string; de: string; categoryId: string; feedback?: L10nRef }[];
}

export interface ListeningChoiceExercise extends ExerciseBase {
  type: "listening_choice";
  /** Spoken by the device's German speech voice; the sentence is not printed in normal playback mode. */
  audio_text_de: string;
  options: { id: string; de?: string; text?: L10nRef; correct: boolean; feedback?: L10nRef }[];
}

export interface MinimalPairsExercise extends ExerciseBase {
  type: "minimal_pairs";
  /** Spoken target word; the learner identifies its spelling from a minimal contrast. */
  audio_text_de: string;
  options: { id: string; de: string; correct: boolean; feedback?: L10nRef }[];
}

export interface DictationExercise extends ExerciseBase {
  type: "dictation";
  audio_text_de: string;
  stem_de?: string;
  /** Accepted sentences are compared with the usual answer normalization. */
  accept: string[];
}

export interface ErrorCorrectionExercise extends ExerciseBase {
  type: "error_correction";
  source_de: string;
  /** One or more accepted corrected sentences. */
  accept: string[];
}

export interface ReplyChoiceExercise extends ExerciseBase {
  type: "reply_choice";
  line_de: string;
  options: { id: string; de?: string; text?: L10nRef; correct: boolean; feedback?: L10nRef }[];
}

export type Exercise = SingleChoiceExercise | MultiChoiceExercise | WordOrderExercise | ClozeExercise | TransformExercise
  | TextInputExercise | DictationExercise | ErrorCorrectionExercise | MinimalPairsExercise | TrueFalseExercise | MatchPairsExercise | CategorizeExercise | ListeningChoiceExercise | ReplyChoiceExercise | KeywordBuildExercise | TokenBankBuildExercise | VerbPositionExercise | NegationExercise | ConnectorChoiceExercise | CaseChoiceExercise | PrepositionChoiceExercise | SeparableVerbExercise | ReadQuestionExercise | DialogueGapExercise | ModalChoiceExercise | OddOneOutExercise | FlashcardRecallExercise | TranslationInputExercise;

export type Block =
  | { type: "explanation"; id: string; body: L10nRef }
  | { type: "pattern"; id: string; caption: L10nRef; columns: L10nRef[]; rows: string[][] }
  | { type: "examples"; id: string; title: L10nRef; items: Example[] }
  | { type: "contrast"; id: string; title: L10nRef; pairs: { id: string; a: Example; b: Example; point: L10nRef }[] }
  | { type: "common_errors"; id: string; title: L10nRef; items: Confusion[] }
  | { type: "regional_note"; id: string; variety: Variety; body: L10nRef }
  | { type: "summary"; id: string; body: L10nRef }
  | { type: "exercises"; id: string; title: L10nRef; items: Exercise[] };

export interface Unit {
  schema: "deutschgo.unit/1";
  id: string;
  version: string;
  status: ContentStatus;
  title: L10nRef;
  summary: L10nRef;
  cefr: Cefr;
  concepts: string[];
  prerequisites: string[];
  goals: ("general" | "everyday" | "work" | "study" | "exam")[];
  estimated_minutes: number;
  objectives: Objective[];
  blocks: Block[];
  sources?: SourceUse[];
  review: Review;
}

export interface Route {
  schema: "deutschgo.route/1";
  id: string;
  version: string;
  status: ContentStatus;
  title: L10nRef;
  summary: L10nRef;
  goals: Unit["goals"];
  cefr: { from: Cefr; to: Cefr };
  steps: { unit?: string; concept?: string; optional?: boolean }[];
}

export interface Localization {
  schema: "deutschgo.l10n/1";
  entity: string;
  lang: string;
  based_on_version: string;
  status: L10nStatus;
  translator?: string;
  reviewer?: string;
  strings: Record<string, string>;
}

export interface LanguageInfo {
  code: string;
  name: string;
  native_name: string;
  dir: "ltr" | "rtl";
  /** 1 = launch wave; 2 = second wave; 3 = planned. */
  wave: 1 | 2 | 3;
  ui: boolean;
  explanations: boolean;
  /** Pivot language: every key must exist here. */
  pivot?: boolean;
}

export interface LanguageRegistry {
  schema: "deutschgo.languages/1";
  languages: LanguageInfo[];
}

export interface SourceInfo {
  id: string;
  name: string;
  url?: string;
  license: string;
  license_url?: string;
  allowed_use: ("link_only" | "internal_research" | "display" | "modify" | "redistribute" | "commercial")[];
  attribution?: string;
  status: "candidate" | "approved" | "rejected";
}

export interface SourceRegistry {
  schema: "deutschgo.sources/1";
  sources: SourceInfo[];
}

export type Entity = Concept | Unit | Route;

export interface ContentRepo {
  root: string;
  concepts: Map<string, Concept>;
  units: Map<string, Unit>;
  routes: Map<string, Route>;
  /** key: `${lang}:${entityId}` */
  l10n: Map<string, Localization>;
  languages: LanguageRegistry;
  sources: SourceRegistry;
  /** entity id -> repository-relative file */
  files: Map<string, string>;
}

export type Severity = "error" | "warning";
export interface Issue {
  severity: Severity;
  code: string;
  file?: string;
  entity?: string;
  message: string;
}
