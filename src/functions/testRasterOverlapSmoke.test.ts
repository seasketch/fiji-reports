/**
 * @jest-environment node
 * @group smoke
 */
import { testRasterOverlap } from "./testRasterOverlap";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof testRasterOverlap).toBe("function");
  });
  test("testRasterOverlapSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await testRasterOverlap(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "testRasterOverlap", example.properties.name);
    }
  }, 400000);
});
