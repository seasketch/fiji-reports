import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { juvenileCoralDensity } from "./juvenileCoralDensity.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof juvenileCoralDensity).toBe("function");
  });
  test("juvenileCoralDensity - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await juvenileCoralDensity(example);
      expect(result).toBeTruthy();
      writeResultOutput(
        result,
        "juvenileCoralDensity",
        example.properties.name,
      );
    }
  }, 60_000);
});
