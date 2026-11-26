import { describe, expect, it } from "vitest";
import { exemplarSetForTopic, exemplarSets } from "./exemplars";
import { ownTopic, writingTopics } from "./topics";

describe("the exemplar follows the topic the student chose", () => {
  it("gives each of the three topics its own exemplar, about the same area but another question", () => {
    const sets = writingTopics.map((topic) => exemplarSetForTopic(topic));
    expect(sets.map((set) => set.id)).toEqual(["school", "screens", "leisure"]);
    expect(sets.map((set) => set.interest)).toEqual(["community", "technology", "sports"]);
    expect(new Set(exemplarSets.map((set) => set.id)).size).toBe(4);
  });

  it("reads the area from the student's own question", () => {
    expect(exemplarSetForTopic(ownTopic("Borde läxor avskaffas?")).id).toBe("school");
    expect(exemplarSetForTopic(ownTopic("Borde dataspel räknas som en sport?")).id).toBe("screens");
    expect(exemplarSetForTopic(ownTopic("Borde alla få spela fotboll i en förening?")).id).toBe("leisure");
    expect(exemplarSetForTopic(ownTopic("Borde vi sluta flyga på semestern?")).id).toBe("food");
  });

  it("never shows an exemplar that argues the student's own question", () => {
    expect(exemplarSetForTopic(ownTopic("Borde åldersgränsen för sociala medier höjas?")).id).not.toBe("screens");
    expect(exemplarSetForTopic(ownTopic("Borde fritidsgården ha öppet på helgerna?")).id).not.toBe("leisure");
    expect(exemplarSetForTopic(ownTopic("Borde skolan ha rörelse varje dag?")).id).not.toBe("school");
    expect(exemplarSetForTopic(ownTopic("Borde alla sluta äta kött?")).id).not.toBe("food");
  });
});
