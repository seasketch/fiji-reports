import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { distanceToShore } from "./distanceToShore.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof distanceToShore).toBe("function");
  });
  test("distanceToShore - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await distanceToShore(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "distanceToShore", example.properties.name);
    }
  }, 60_000);
});
