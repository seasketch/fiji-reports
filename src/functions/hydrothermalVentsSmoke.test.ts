import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { hydrothermalVents } from "./hydrothermalVents.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof hydrothermalVents).toBe("function");
  });
  test("hydrothermalVents - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await hydrothermalVents(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "hydrothermalVents", example.properties.name);
    }
  }, 60_000);
});
