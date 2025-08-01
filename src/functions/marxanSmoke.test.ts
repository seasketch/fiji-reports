import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { marxan } from "./marxan.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof marxan).toBe("function");
  });
  test("marxan - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await marxan(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "marxan", example.properties.name);
    }
  }, 500_000);
});
