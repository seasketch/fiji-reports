import {
  PreprocessingHandler,
  Feature,
  Sketch,
  ensureValidPolygon,
  Polygon,
  MultiPolygon,
  FeatureClipOperation,
  clipToPolygonFeatures,
  FeatureCollection,
  Position,
  splitBBoxAntimeridian,
  getFeaturesForBBoxes,
  BBox,
} from "@seasketch/geoprocessing";
import fijiEez from "./fiji_eez.json" with { type: "json" };
import { bbox } from "@turf/turf";

/**
 * Preprocessor takes a Polygon feature/sketch and returns the portion that
 * is in the ocean (not on land) and within one or more EEZ boundaries.
 */
export async function clipToOceanEez(
  feature: Feature | Sketch,
): Promise<Feature> {
  ensureValidPolygon(feature, {
    minSize: 1,
    enforceMinSize: false,
    maxSize: 500_000 * 1000 ** 2,
    enforceMaxSize: false,
  });

  // The Fiji EEZ crosses the antimeridian
  // To keep the sketch a simple polygon, we need make our EEZ clipping coordinates
  // extend positively beyond the antimeridian
  const fijiEezUnclean = makeEezUnclean(
    fijiEez as FeatureCollection,
    -170,
    360,
  );

  const splitBbox = splitBBoxAntimeridian(bbox(feature));

  const landFeatures: Feature<Polygon | MultiPolygon>[] =
    await getFeaturesForBBoxes(
      splitBbox as BBox[],
      "https://gp-global-datasources-datasets.s3.us-west-1.amazonaws.com/global-coastline-daylight-v158.fgb",
    );

  const eraseLand: FeatureClipOperation = {
    operation: "difference",
    clipFeatures: landFeatures,
  };

  const keepInsideEez: FeatureClipOperation = {
    operation: "intersection",
    clipFeatures: fijiEezUnclean.features as Feature<Polygon | MultiPolygon>[],
  };

  return clipToPolygonFeatures(feature, [eraseLand, keepInsideEez]);
}

export default new PreprocessingHandler(clipToOceanEez, {
  title: "clipToOceanEez",
  description: "Example-description",
  timeout: 40,
  requiresProperties: [],
  memory: 1024,
});

export function makeEezUnclean(
  eez: FeatureCollection,
  threshold = -120,
  offset = 360,
): FeatureCollection {
  // Deep clone so we don't mutate the original
  const newEez = JSON.parse(JSON.stringify(eez)) as FeatureCollection;

  newEez.features.forEach((feature) => {
    if (
      feature.geometry.type !== "Polygon" &&
      feature.geometry.type !== "MultiPolygon"
    ) {
      throw new Error("Invalid geometry type");
    }
    shiftGeometry(feature.geometry, threshold, offset);
  });

  return newEez;
}

function shiftGeometry(
  geometry: Polygon | MultiPolygon,
  threshold: number,
  offset: number,
): void {
  const { type, coordinates } = geometry;

  switch (type) {
    case "Polygon": {
      const coords = coordinates as Position[][];
      coords.forEach((ring) => {
        ring.forEach((coord) => {
          if (coord[0] <= threshold) {
            coord[0] += offset;
          }
        });
      });
      break;
    }
    case "MultiPolygon": {
      const coords = coordinates as Position[][][];
      coords.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coord) => {
            if (coord[0] <= threshold) {
              coord[0] += offset;
            }
          });
        });
      });
      break;
    }
    default:
      console.warn(`Geometry type ${type} not supported`);
  }
}
