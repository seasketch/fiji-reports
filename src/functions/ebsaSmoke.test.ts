import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { ebsa } from "./ebsa.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof ebsa).toBe("function");
  });
  test("ebsa - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await ebsa(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "ebsa", example.properties.name);
    }
  }, 60_000);
});
