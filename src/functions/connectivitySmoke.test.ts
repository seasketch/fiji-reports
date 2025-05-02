import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { connectivity } from "./connectivity.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof connectivity).toBe("function");
  });
  test("connectivity - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await connectivity(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "connectivity", example.properties.name);
    }
  }, 60_000);
});
