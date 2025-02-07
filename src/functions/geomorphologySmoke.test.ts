import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { geomorphology } from "./geomorphology.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof geomorphology).toBe("function");
  });
  test("geomorphology - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await geomorphology(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "geomorphology", example.properties.name);
    }
  }, 60_000);
});
