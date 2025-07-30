import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { bleachingAlerts } from "./bleachingAlerts.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof bleachingAlerts).toBe("function");
  });
  test("bleachingAlerts - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await bleachingAlerts(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "bleachingAlerts", example.properties.name);
    }
  }, 60_000);
});
