import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { sites } from "./sites.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof sites).toBe("function");
  });
  test("sites - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await sites(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "sites", example.properties.name);
    }
  }, 60_000);
});
