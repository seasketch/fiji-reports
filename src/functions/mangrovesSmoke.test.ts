import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { mangroves } from "./mangroves.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof mangroves).toBe("function");
  });
  test("mangroves - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await mangroves(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "mangroves", example.properties.name);
    }
  }, 60_000);
});
