import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { benthicACA } from "./benthicACA.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof benthicACA).toBe("function");
  });
  test("benthicACA - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll("ventsOverlap");
    for (const example of examples) {
      const result = await benthicACA(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "benthicACA", example.properties.name);
    }
  }, 500_000);
});
