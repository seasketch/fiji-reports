import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { benthicCover } from "./benthicCover.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof benthicCover).toBe("function");
  });
  test("benthicCover - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await benthicCover(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "benthicCover", example.properties.name);
    }
  }, 60_000);
});
