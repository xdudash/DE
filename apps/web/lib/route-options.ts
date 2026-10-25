import "server-only";
import { routeFromBundle } from "@deutschgo/learning-engine";
import type { ContentBundle } from "@deutschgo/content-kit";
import type { RoutePlanOption } from "./route-plan-client";
import { dictionaryFor, t } from "./content";
import { ui } from "./i18n";

export function routeOptionsFromBundle(bundle: ContentBundle, lang: string, contentLang: string): RoutePlanOption[] {
  const msg = ui(lang);
  const units = new Map(bundle.units.map((unit) => [unit.id, unit]));
  const concepts = new Map(bundle.concepts.map((concept) => [concept.id, concept]));
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);
  const unitForConcept = new Map<string, string>();
  for (const unit of bundle.units) for (const conceptId of unit.concepts) if (!unitForConcept.has(conceptId)) unitForConcept.set(conceptId, unit.id);

  return bundle.routes.map((route) => {
    const routeText = dictionaryFor(route.id, route, contentLang);
    const steps = route.steps.flatMap((step): RoutePlanOption["steps"] => {
      const id = step.unit ?? step.concept;
      if (!id) return [];
      const unitId = step.unit ?? (step.concept ? unitForConcept.get(step.concept) : undefined);
      const unit = unitId ? units.get(unitId) : undefined;
      if (unit) return [{
        id,
        title: title(unit.id, unit, unit.title),
        kind: "lesson",
        unitId: unit.id,
        href: `/${lang}/learn/${unit.id}`,
        meta: msg("catalog.unitMeta", { level: unit.cefr, minutes: unit.estimated_minutes }),
        exerciseIds: unit.blocks.flatMap((block) => block.type === "exercises" ? block.items.map((exercise) => exercise.id) : []),
        optional: !!step.optional,
      }];
      const concept = step.concept ? concepts.get(step.concept) : undefined;
      if (!concept) return [];
      return [{ id, title: title(concept.id, concept, concept.title), kind: "planned", href: `/${lang}/map#${concept.id}`, exerciseIds: [], optional: !!step.optional }];
    });
    return {
      id: route.id,
      title: t(routeText, route.title),
      summary: t(routeText, route.summary),
      badge: route.cefr.from,
      from: route.cefr.from,
      to: route.cefr.to,
      goals: route.goals,
      steps,
      recommendation: routeFromBundle(bundle, route.id),
    };
  });
}
