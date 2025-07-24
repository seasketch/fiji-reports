import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { invertPresence } from "./invertPresence.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof invertPresence).toBe("function");
  });
  test("invertPresence - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await invertPresence(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "invertPresence", example.properties.name);
    }
  }, 60_000);
});
