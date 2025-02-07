import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { biodiversity } from "./biodiversity.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof biodiversity).toBe("function");
  });
  test("biodiversity - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await biodiversity(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "biodiversity", example.properties.name);
    }
  }, 60_000);
});
