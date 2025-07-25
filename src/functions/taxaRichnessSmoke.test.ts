import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { taxaRichness } from "./taxaRichness.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof taxaRichness).toBe("function");
  });
  test("taxaRichness - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await taxaRichness(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "taxaRichness", example.properties.name);
    }
  }, 60_000);
});
