import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { size } from "./size.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof size).toBe("function");
  });
  test("size - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await size(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "size", example.properties.name);
    }
  }, 60_000);
});
