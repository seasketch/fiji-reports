import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  toSketchArray,
  toRasterProjection,
  isSketchCollection,
  MultiPolygon,
  isRasterDatasource,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import { mean } from "simple-statistics";
import project from "../../project/projectClient.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

// @ts-expect-error no types
import geoblaze, { Georaster } from "geoblaze";

export async function pristineSeas(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("pristineSeas");
  const allMetrics: Metric[] = [];

  await Promise.all(
    metricGroup.classes.map(async (curClass) => {
      const ds = project.getMetricGroupDatasource(metricGroup, {
        classId: curClass.classId,
      });
      if (!isRasterDatasource(ds))
        throw new Error(`Expected raster datasource for ${ds.datasourceId}`);
      const url = project.getDatasourceUrl(ds);

      const raster = await loadCog(url);

      // Calculate metrics for individual sketches
      const sketchMetrics = await calculateSketchMetrics(
        splitSketch,
        raster,
        metricGroup.metricId,
        curClass.classId,
      );
      allMetrics.push(...sketchMetrics);

      // Calculate overall mean for the collection (only if it's a sketch collection)
      if (isSketchCollection(splitSketch)) {
        const overallMean = await calculateOverallMean(splitSketch, raster);
        allMetrics.push({
          metricId: metricGroup.metricId,
          classId: curClass.classId,
          value: overallMean,
          geographyId: null,
          sketchId: sketch.properties.id,
          groupId: null,
          extra: {
            isCollection: true,
          },
        });
      }
    }),
  );

  return {
    metrics: sortMetrics(rekeyMetrics(allMetrics)),
  };
}

/**
 * Calculate metrics for individual sketches
 */
async function calculateSketchMetrics(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  raster: Georaster,
  metricId: string,
  classId: string,
): Promise<Metric[]> {
  const features = toSketchArray(sketch);

  const sketchMetrics: Metric[] = await Promise.all(
    features.map(async (feature) => {
      const finalFeat = toRasterProjection(raster, feature);
      if (!finalFeat.geometry.coordinates.length) {
        return {
          metricId,
          classId,
          value: NaN,
          geographyId: null,
          sketchId: feature.properties.id || null,
          groupId: null,
        };
      }

      try {
        const stats = (
          await geoblaze.stats(raster, finalFeat, {
            calcMean: true,
          })
        )[0];
        return {
          metricId,
          classId,
          value: stats.mean || NaN,
          geographyId: null,
          sketchId: feature.properties.id || null,
          groupId: null,
        };
      } catch (err) {
        if (err === "No Values were found in the given geometry") {
          return {
            metricId,
            classId,
            value: NaN,
            geographyId: null,
            sketchId: feature.properties.id || null,
            groupId: null,
          };
        } else {
          throw err;
        }
      }
    }),
  );

  return sketchMetrics;
}

/**
 * Calculate the overall mean of all sketches for a given raster
 */
async function calculateOverallMean(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  raster: Georaster,
): Promise<number> {
  const features = toSketchArray(sketch);

  const sketchMeans: number[] = await Promise.all(
    features.map(async (feature) => {
      const finalFeat = toRasterProjection(raster, feature);
      if (!finalFeat.geometry.coordinates.length) {
        return null;
      }

      try {
        const stats = (
          await geoblaze.stats(raster, finalFeat, {
            calcMean: true,
          })
        )[0];
        return stats.mean;
      } catch (err) {
        if (err === "No Values were found in the given geometry") {
          return null;
        } else {
          throw err;
        }
      }
    }),
  );

  // Filter out null values and calculate overall mean
  const validMeans = sketchMeans.filter(
    (value): value is number => value !== null && value !== undefined,
  );

  return validMeans.length > 0 ? mean(validMeans) : 0;
}

export default new GeoprocessingHandler(pristineSeas, {
  title: "pristineSeas",
  description: "calculates pristineSeas within given sketch",
  timeout: 500, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
