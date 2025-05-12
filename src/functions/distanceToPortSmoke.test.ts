import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { distanceToPort } from "./distanceToPort.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof distanceToPort).toBe("function");
  });
  test("distanceToPort - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await distanceToPort(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "distanceToPort", example.properties.name);
    }
  }, 60_000);
});
