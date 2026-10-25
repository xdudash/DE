import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { bundle, UNIT, V2 } from "../../../packages/attempts/test/fixtures.ts";
import { scenarioMissions } from "../lib/missions.ts";

describe("DACH scenario missions", () => {
  it("offers only units with real reply-choice exercises and resolves their text", () => {
    const content = bundle();
    const base = content.units.find((unit) => unit.id === UNIT)!;
    content.units.push({
      ...base,
      id: "unit.scenario.cafe",
      title: "@cafe.title",
      summary: "@cafe.summary",
      blocks: [{
        type: "exercises", id: "b_mission", title: "@mission.title",
        items: [{
          id: "x_reply", type: "reply_choice", objective: "obj_produce", concepts: [V2], difficulty: 1,
          prompt: "@reply.prompt", line_de: "Was darf es sein?",
          options: [{ id: "a", de: "Ein Kaffee, bitte.", correct: true }, { id: "b", de: "Ich bin Kaffee.", correct: false }],
          feedback: { correct: "@ok", incorrect: "@no" }, explanation: "@why",
        }],
      }],
    });

    const missions = scenarioMissions(content, (id, ref) => `${id}:${ref}`);
    assert.deepEqual(missions, [{
      unitId: "unit.scenario.cafe", title: "unit.scenario.cafe:@cafe.title", summary: "unit.scenario.cafe:@cafe.summary",
      level: "A1", exerciseCount: 1, reviewed: false,
    }]);
  });
});
