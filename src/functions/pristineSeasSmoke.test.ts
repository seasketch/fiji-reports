import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { pristineSeas } from "./pristineSeas.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof pristineSeas).toBe("function");
  });
  test("pristineSeas - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await pristineSeas(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "pristineSeas", example.properties.name);
    }
  }, 60_000);
});
