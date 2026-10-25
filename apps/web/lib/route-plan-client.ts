"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { RouteStep } from "@deutschgo/learning-engine";

export interface RoutePlanStep {
  id: string;
  title: string;
  kind: "lesson" | "planned";
  unitId?: string;
  href?: string;
  meta?: string;
  exerciseIds: string[];
  optional: boolean;
}

export interface RoutePlanOption {
  id: string;
  title: string;
  summary: string;
  badge: string;
  from: string;
  to: string;
  goals: string[];
  steps: RoutePlanStep[];
  recommendation: RouteStep[];
  preview?: { unitId: string; node: ReactNode };
}

interface RouteSettings { order: string[]; skipped: string[] }
interface Preferences { activeRouteId: string | null; routes: Record<string, RouteSettings> }

const KEY = "deutschgo.route-plan.v1";
const EMPTY: Preferences = { activeRouteId: null, routes: {} };

function readPreferences(): Preferences {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (!value || typeof value !== "object") return EMPTY;
    const source = value as Record<string, unknown>;
    const routes = source.routes && typeof source.routes === "object" ? source.routes as Record<string, unknown> : {};
    const valid: Record<string, RouteSettings> = {};
    for (const [id, raw] of Object.entries(routes)) {
      if (!raw || typeof raw !== "object") continue;
      const setting = raw as Record<string, unknown>;
      valid[id] = {
        order: Array.isArray(setting.order) ? setting.order.filter((x): x is string => typeof x === "string") : [],
        skipped: Array.isArray(setting.skipped) ? setting.skipped.filter((x): x is string => typeof x === "string") : [],
      };
    }
    return { activeRouteId: typeof source.activeRouteId === "string" ? source.activeRouteId : null, routes: valid };
  } catch {
    return EMPTY;
  }
}

function writePreferences(value: Preferences): boolean {
  try { window.localStorage.setItem(KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function orderedRouteSteps(route: RoutePlanOption, settings?: RouteSettings, includeSkipped = false): RoutePlanStep[] {
  const byId = new Map(route.steps.map((step) => [step.id, step]));
  const order = settings?.order ?? [];
  const reordered = [...order.filter((id, index) => byId.has(id) && order.indexOf(id) === index).map((id) => byId.get(id)!), ...route.steps.filter((step) => !order.includes(step.id))];
  if (includeSkipped) return reordered;
  const skipped = new Set(settings?.skipped ?? []);
  return reordered.filter((step) => !skipped.has(step.id));
}

export function useRoutePlan(routes: RoutePlanOption[], defaultRouteId: string) {
  const [preferences, setPreferences] = useState<Preferences>(EMPTY);
  useEffect(() => {
    setPreferences(readPreferences());
    const sync = (event: StorageEvent) => { if (event.key === KEY || event.key === null) setPreferences(readPreferences()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const routeById = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);
  const activeRouteId = preferences.activeRouteId && routeById.has(preferences.activeRouteId) ? preferences.activeRouteId : defaultRouteId;
  const activeRoute = routeById.get(activeRouteId) ?? routes[0];
  const activeSettings = activeRoute ? preferences.routes[activeRoute.id] : undefined;
  const activeSteps = activeRoute ? orderedRouteSteps(activeRoute, activeSettings) : [];

  function updateRoute(routeId: string, setting: RouteSettings): boolean {
    const next: Preferences = { ...preferences, routes: { ...preferences.routes, [routeId]: setting } };
    setPreferences(next);
    return writePreferences(next);
  }

  function selectRoute(routeId: string): boolean {
    if (!routeById.has(routeId)) return false;
    const next = { ...preferences, activeRouteId: routeId };
    setPreferences(next);
    return writePreferences(next);
  }

  function moveStep(routeId: string, ids: string[], index: number, delta: -1 | 1): boolean {
    const target = index + delta;
    if (target < 0 || target >= ids.length) return true;
    const order = [...ids];
    [order[index], order[target]] = [order[target]!, order[index]!];
    const current = preferences.routes[routeId] ?? { order: [], skipped: [] };
    return updateRoute(routeId, { ...current, order });
  }

  function toggleStep(routeId: string, stepId: string): boolean {
    const current = preferences.routes[routeId] ?? { order: [], skipped: [] };
    const skipped = new Set(current.skipped);
    if (skipped.has(stepId)) skipped.delete(stepId); else skipped.add(stepId);
    return updateRoute(routeId, { ...current, skipped: [...skipped] });
  }

  function resetRoute(routeId: string): boolean {
    const next = { ...preferences, routes: { ...preferences.routes } };
    delete next.routes[routeId];
    setPreferences(next);
    return writePreferences(next);
  }

  return { preferences, activeRoute, activeRouteId, activeSteps, selectRoute, moveStep, toggleStep, resetRoute };
}
