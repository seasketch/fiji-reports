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
  isFeature,
  toFeatureArray,
} from "@seasketch/geoprocessing";
import fijiEez from "./eez_v11_clippingLayer.json" with { type: "json" };

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

  const sketchUnclean = makeUnclean(feature, -170, 360) as Feature;

  const keepInsideEez: FeatureClipOperation = {
    operation: "intersection",
    clipFeatures: toFeatureArray(fijiEez as FeatureCollection) as Feature<
      Polygon | MultiPolygon
    >[],
  };

  return clipToPolygonFeatures(sketchUnclean, [keepInsideEez]);
}

export default new PreprocessingHandler(clipToOceanEez, {
  title: "clipToOceanEez",
  description: "Example-description",
  timeout: 40,
  requiresProperties: [],
  memory: 1024,
});

export function makeUnclean(
  shape: Feature | FeatureCollection,
  threshold = -120,
  offset = 360,
): Feature | FeatureCollection {
  const newShape = JSON.parse(JSON.stringify(shape)) as
    | Feature
    | FeatureCollection;

  if (isFeature(newShape)) {
    if (
      newShape.geometry.type !== "Polygon" &&
      newShape.geometry.type !== "MultiPolygon"
    ) {
      throw new Error("Invalid geometry type");
    }
    shiftGeometry(newShape.geometry, threshold, offset);
  } else {
    newShape.features.forEach((feature) => {
      if (
        feature.geometry.type !== "Polygon" &&
        feature.geometry.type !== "MultiPolygon"
      ) {
        throw new Error("Invalid geometry type");
      }
      shiftGeometry(feature.geometry, threshold, offset);
    });
  }

  return newShape;
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
