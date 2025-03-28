import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { suma } from "./suma.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof suma).toBe("function");
  });
  test("suma - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await suma(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "suma", example.properties.name);
    }
  }, 60_000);
});
