import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { dhw } from "./dhw.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof dhw).toBe("function");
  });
  test("dhw - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await dhw(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "dhw", example.properties.name);
    }
  }, 60_000);
});
