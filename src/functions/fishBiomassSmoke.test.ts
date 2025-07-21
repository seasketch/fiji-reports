import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { fishBiomass } from "./fishBiomass.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof fishBiomass).toBe("function");
  });
  test("fishBiomass - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await fishBiomass(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "fishBiomass", example.properties.name);
    }
  }, 60_000);
});
