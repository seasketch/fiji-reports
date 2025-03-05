import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { benthicRichness } from "./benthicRichness.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof benthicRichness).toBe("function");
  });
  test("benthicRichness - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll("large-network");
    for (const example of examples) {
      const result = await benthicRichness(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "benthicRichness", example.properties.name);
    }
  }, 60_000);
});
