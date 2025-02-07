import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { gfw } from "./gfw.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof gfw).toBe("function");
  });
  test("gfw - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await gfw(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "gfw", example.properties.name);
    }
  }, 60_000);
});
