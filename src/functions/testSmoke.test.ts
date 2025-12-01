import {
  getExamplePolygonSketchAll,
  writeResultOutput,
  polygonSmokeTest,
  getExampleFeatures,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { bathymetry } from "./bathymetry.js";
import { benthicACA } from "./benthicACA.js";
import { benthicCover } from "./benthicCover.js";
import { benthicRichness } from "./benthicRichness.js";
import { bleachingAlerts } from "./bleachingAlerts.js";
import handler, { clipToOceanEez } from "./clipToOceanEez.js";
import { deepwaterBioregions } from "./deepwaterBioregions.js";
import { dhw } from "./dhw.js";
import { distanceToPort } from "./distanceToPort.js";
import { distanceToShore } from "./distanceToShore.js";
import { ebsa } from "./ebsa.js";
import { fishBiomass } from "./fishBiomass.js";
import { fishDensity } from "./fishDensity.js";
import { geomorphology } from "./geomorphology.js";
import { gfw } from "./gfw.js";
import { hydrothermalVents } from "./hydrothermalVents.js";
import { invertPresence } from "./invertPresence.js";
import { juvenileCoralDensity } from "./juvenileCoralDensity.js";
import { mangroves } from "./mangroves.js";
import { marxan } from "./marxan.js";
import { pristineSeas } from "./pristineSeas.js";
import { sites } from "./sites.js";
import { size } from "./size.js";
import { suma } from "./suma.js";
import { taxaRichness } from "./taxaRichness.js";
import { waterQuality } from "./waterQuality.js";
import { geomorphACA } from "./geomorphACA.js";

// Create standard smoke tests
function createSmokeTest(
  functionName: string,
  functionToTest: Function,
  timeout: number = 60_000,
) {
  describe(functionName, () => {
    test("handler function is present", () => {
      expect(typeof functionToTest).toBe("function");
    });

    test(
      `${functionName} - tests run against all examples`,
      async () => {
        const examples = await getExamplePolygonSketchAll("mpa");
        for (const example of examples) {
          const result = await functionToTest(example);
          expect(result).toBeTruthy();
          writeResultOutput(result, functionName, example.properties.name);
        }
      },
      timeout,
    );
  });
}

const tests = [
  { name: "bathymetry", func: bathymetry },
  { name: "benthicACA", func: benthicACA, timeout: 500_000 },
  { name: "benthicCover", func: benthicCover },
  { name: "benthicRichness", func: benthicRichness },
  { name: "bleachingAlerts", func: bleachingAlerts },
  { name: "deepwaterBioregions", func: deepwaterBioregions },
  { name: "dhw", func: dhw },
  { name: "distanceToPort", func: distanceToPort },
  { name: "distanceToShore", func: distanceToShore },
  { name: "ebsa", func: ebsa },
  { name: "fishBiomass", func: fishBiomass },
  { name: "fishDensity", func: fishDensity },
  { name: "geomorphology", func: geomorphology },
  { name: "geomorphACA", func: geomorphACA, timeout: 500_000 },
  { name: "gfw", func: gfw },
  { name: "hydrothermalVents", func: hydrothermalVents },
  { name: "invertPresence", func: invertPresence },
  { name: "juvenileCoralDensity", func: juvenileCoralDensity },
  { name: "mangroves", func: mangroves, timeout: 500_000 },
  { name: "marxan", func: marxan, timeout: 500_000 },
  { name: "pristineSeas", func: pristineSeas },
  { name: "sites", func: sites },
  { name: "size", func: size },
  { name: "suma", func: suma },
  { name: "taxaRichness", func: taxaRichness },
  { name: "waterQuality", func: waterQuality },
];

// Generate tests
tests.forEach(({ name, func, timeout }) => {
  createSmokeTest(name, func, timeout);
});

// clipToOceanEez
describe("clipToOceanEez", () => {
  test("clipToOceanEez", async () => {
    const examples = await getExampleFeatures();
    polygonSmokeTest(clipToOceanEez, handler.options.title, examples, {
      timeout: 60_000,
      debug: false,
    });
  }, 60_000);
});
