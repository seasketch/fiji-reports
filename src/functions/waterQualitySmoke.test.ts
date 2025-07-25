import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { waterQuality } from "./waterQuality.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof waterQuality).toBe("function");
  });
  test("waterQuality - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await waterQuality(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "waterQuality", example.properties.name);
    }
  }, 60_000);
});
