import { clip, roundDecimal } from "@seasketch/geoprocessing";
import {
  Feature,
  isSketchCollection,
  MultiPolygon,
  Polygon,
  Sketch,
  SketchCollection,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { featureCollection, truncate as truncateGeom } from "@turf/turf";

export interface SpRichnessResults {
  sketchId: string;
  sketchName: string;
  min: number;
  max: number;
  mean: number;
  isCollection?: boolean;
}

/**
 * Calculates area overlap between sketch(es) and an array of polygon features.
 * Truncates input geometry coordinates down to 6 decimal places (~1m accuracy) before intersection to avoid floating point precision issues.
 * If sketch collection, then calculates area per sketch and for sketch collection
 * @param features to intersect and get overlap metrics
 * @param sketch the sketches.  If empty will return 0 result.
 * @param options.truncate truncate results to 6 digits after decimal point, defaults to true
 * @param options.includeChildMetrics if false and sketch is collection, child sketch metrics will not be included in results, defaults to true
 * @param options.featProperty Property in features with value to sum, if not defined each feature will count as 1
 * @returns array of Metric objects
 */
export async function overlapPolygonStats(
  features: Feature<Polygon | MultiPolygon>[],
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
    | Sketch<Polygon | MultiPolygon>[],
  options: {
    truncate?: boolean;
    includeChildMetrics?: boolean;
    featProperty?: string;
  } = {},
): Promise<SpRichnessResults[]> {
  const { includeChildMetrics = true, truncate = true, featProperty } = options;

  // Collect indices of features that intersect with sketch(es) for later calculation of collection level sum
  const featureIndices: Set<number> = new Set();

  const truncatedSketches = (
    Array.isArray(sketch) ? sketch : toSketchArray(sketch)
  ).map((s) => truncateGeom(s));
  const truncatedFeatures = features.map((f) => truncateGeom(f));

  // Individual sketch metrics
  const sketchMetrics: SpRichnessResults[] = truncatedSketches.map(
    (curSketch) => {
      const intersections = intersectRichness(
        curSketch,
        truncatedFeatures,
        featProperty,
      );

      // Accumulate feature indices that intersect with collection
      for (const index of intersections.indices) featureIndices.add(index);

      return {
        sketchId: curSketch.properties.id,
        sketchName: curSketch.properties.name,
        min: roundDecimal(intersections.min),
        max: roundDecimal(intersections.max),
        mean: roundDecimal(intersections.mean),
      };
    },
  );

  const metrics = includeChildMetrics ? sketchMetrics : [];

  // Collection level metrics
  if (isSketchCollection(sketch)) {
    const richness: number[] = [...featureIndices].map((index: number) => {
      const feature = features[index];
      if (
        featProperty &&
        feature.properties &&
        feature.properties[featProperty]
      ) {
        return feature.properties[featProperty];
      }
      return 1;
    });

    metrics.push({
      sketchId: sketch.properties.id,
      sketchName: sketch.properties.name,
      isCollection: true,
      min: roundDecimal(Math.min(...richness)),
      max: roundDecimal(Math.max(...richness)),
      mean: roundDecimal(richness.reduce((a, b) => a + b, 0) / richness.length),
    });
  }

  return metrics;
}

/**
 * Returns an object containing the sum value of features in B that intersect with featureA,
 * and the indices of the features in B that intersect with featureA
 * No support for partial overlap, counts the whole feature if it intersects.
 * @param featureA single feature to intersect with featuresB
 * @param featuresB array of features
 * @param featProperty Property in featuresB with value, if not defined each feature will count as 1
 * @returns Min, max, and avg of features/feature property which overlap with the sketch, and a list of
 * indices for features that overlap with the sketch to be used in calculating total sum of
 * the sketch collection
 */
export const intersectRichness = (
  featureA: Feature<Polygon | MultiPolygon>,
  featuresB: Feature<Polygon | MultiPolygon>[],
  featProperty?: string,
) => {
  const indices: number[] = [];
  const richness: number[] = [];

  featuresB.forEach((curFeature, index) => {
    // Optimization: can this be done with turf.booleanIntersects?
    const rem = clip(featureCollection([featureA, curFeature]), "intersection");

    if (!rem) return 0;

    indices.push(index);

    let featureValue = 1;
    if (featProperty && curFeature.properties![featProperty] >= 0)
      featureValue = curFeature.properties![featProperty];
    richness.push(featureValue);
  });

  const min = Math.min(...richness);
  const max = Math.max(...richness);
  const mean = richness.reduce((a, b) => a + b, 0) / richness.length;

  return { min, max, mean, indices: indices };
};
