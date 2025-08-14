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
import { connectivity } from "./connectivity.js";
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
        const examples = await getExamplePolygonSketchAll();
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
  { name: "bathymetry", func: bathymetry, timeout: 60_000 },
  { name: "benthicACA", func: benthicACA, timeout: 500_000 },
  { name: "benthicCover", func: benthicCover, timeout: 60_000 },
  { name: "benthicRichness", func: benthicRichness, timeout: 60_000 },
  { name: "bleachingAlerts", func: bleachingAlerts, timeout: 60_000 },
  { name: "connectivity", func: connectivity, timeout: 60_000 },
  { name: "deepwaterBioregions", func: deepwaterBioregions, timeout: 60_000 },
  { name: "dhw", func: dhw, timeout: 60_000 },
  { name: "distanceToPort", func: distanceToPort, timeout: 60_000 },
  { name: "distanceToShore", func: distanceToShore, timeout: 60_000 },
  { name: "ebsa", func: ebsa, timeout: 60_000 },
  { name: "fishBiomass", func: fishBiomass, timeout: 60_000 },
  { name: "fishDensity", func: fishDensity, timeout: 60_000 },
  { name: "geomorphology", func: geomorphology, timeout: 60_000 },
  { name: "gfw", func: gfw, timeout: 60_000 },
  { name: "hydrothermalVents", func: hydrothermalVents, timeout: 60_000 },
  { name: "invertPresence", func: invertPresence, timeout: 60_000 },
  { name: "juvenileCoralDensity", func: juvenileCoralDensity, timeout: 60_000 },
  { name: "mangroves", func: mangroves, timeout: 60_000 },
  { name: "marxan", func: marxan, timeout: 500_000 },
  { name: "pristineSeas", func: pristineSeas, timeout: 60_000 },
  { name: "sites", func: sites, timeout: 60_000 },
  { name: "size", func: size, timeout: 60_000 },
  { name: "suma", func: suma, timeout: 60_000 },
  { name: "taxaRichness", func: taxaRichness, timeout: 60_000 },
  { name: "waterQuality", func: waterQuality, timeout: 60_000 },
];

// Generate tests
tests.forEach(({ name, func, timeout }) => {
  createSmokeTest(name, func, timeout);
});

// clipToOceanEez - special case
describe("clipToOceanEez", () => {
  test("clipToOceanEez", async () => {
    const examples = await getExampleFeatures();
    polygonSmokeTest(clipToOceanEez, handler.options.title, examples, {
      timeout: 60_000,
      debug: false,
    });
  }, 60_000);
});
