import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { bathymetry } from "./bathymetry.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof bathymetry).toBe("function");
  });
  test("bathymetry - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await bathymetry(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "bathymetry", example.properties.name);
    }
  }, 60_000);
});
