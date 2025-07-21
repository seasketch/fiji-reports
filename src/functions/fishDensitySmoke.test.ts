import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { fishDensity } from "./fishDensity.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof fishDensity).toBe("function");
  });
  test("fishDensity - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await fishDensity(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "fishDensity", example.properties.name);
    }
  }, 60_000);
});
