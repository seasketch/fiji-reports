import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  toSketchArray,
  toRasterProjection,
  isSketchCollection,
  isRasterDatasource,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import project from "../../project/projectClient.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";
import {
  Metric,
  ReportResult,
  createMetric,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

// @ts-expect-error no types
import geoblaze from "geoblaze";
import { featureCollection } from "@turf/turf";

export interface HistogramData {
  value: number;
  count: number;
}

export interface PristineSeasReportResult extends ReportResult {
  histogram?: HistogramData[];
}

export async function pristineSeas(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<PristineSeasReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("pristineSeas");
  const allMetrics: Metric[] = [];
  let histogramData: HistogramData[] | undefined;

  const sketchArray = toSketchArray(splitSketch);

  await Promise.all(
    metricGroup.classes.map(async (curClass) => {
      const ds = project.getMetricGroupDatasource(metricGroup, {
        classId: curClass.classId,
      });
      if (!isRasterDatasource(ds))
        throw new Error(`Expected raster datasource for ${ds.datasourceId}`);
      const url = project.getDatasourceUrl(ds);
      const raster = await loadCog(url);

      // Calculate histogram for multi class
      if (curClass.classId === "multi") {
        try {
          const finalFeat = toRasterProjection(raster, splitSketch);
          // Get raw histogram data
          const histogram = await geoblaze.histogram(raster, finalFeat, {
            scaleType: "nominal",
          });

          if (
            histogram &&
            histogram[0] &&
            Object.keys(histogram[0]).length > 0
          ) {
            // Create 20 bins from 0 to 1 (each bin is 0.05 wide)
            const numBins = 20;
            const binSize = 1 / numBins;
            const bins = new Array(numBins).fill(0);

            // Distribute raw histogram values into our 20 bins
            Object.entries(histogram[0]).forEach(([valueStr, count]) => {
              const value = parseFloat(valueStr);
              if (!isNaN(value) && value >= 0 && value <= 1) {
                // Determine which bin this value belongs to
                let binIndex = Math.floor(value / binSize);
                // Handle edge case where value === 1.0
                if (binIndex >= numBins) binIndex = numBins - 1;
                bins[binIndex] += count as number;
              }
            });

            // Only create histogram data if we have actual values
            const totalCount = bins.reduce((sum, count) => sum + count, 0);
            if (totalCount > 0) {
              histogramData = bins.map((count, index) => ({
                value:
                  Math.round((index * binSize + binSize / 2) * 1000) / 1000, // Use bin midpoint, rounded to 3 decimals
                count: count,
              }));
            }
          }
        } catch (err) {
          console.log("Histogram calculation failed:", err);
        }
      }

      const metrics: Metric[] = await Promise.all(
        sketchArray.map(async (sketch) => {
          const finalFeat = toRasterProjection(raster, sketch);
          if (!finalFeat.geometry.coordinates.length)
            throw new Error("No coordinates found for sketch");

          try {
            const stats = (
              await geoblaze.stats(raster, finalFeat, {
                calcMean: true,
              })
            )[0];
            return createMetric({
              metricId: metricGroup.metricId,
              classId: curClass.classId,
              value: stats.mean || NaN,
              sketchId: sketch.properties.id,
            });
          } catch (err) {
            if (err === "No Values were found in the given geometry")
              return createMetric({
                metricId: metricGroup.metricId,
                classId: curClass.classId,
                value: NaN,
                sketchId: sketch.properties.id,
              });
            else {
              throw err;
            }
          }
        }),
      );

      allMetrics.push(...metrics);

      // Calculate overall mean for the collection (only if it's a sketch collection)
      if (isSketchCollection(splitSketch)) {
        const collection = featureCollection(
          sketchArray.map((sk) => toRasterProjection(raster, sk)),
        );
        try {
          const stats = (
            await geoblaze.stats(raster, collection, {
              calcMean: true,
            })
          )[0];
          allMetrics.push({
            metricId: metricGroup.metricId,
            classId: curClass.classId,
            value: stats.mean || NaN,
            geographyId: null,
            sketchId: sketch.properties.id,
            groupId: null,
            extra: {
              isCollection: true,
            },
          });
        } catch (err) {
          if (err === "No Values were found in the given geometry")
            allMetrics.push({
              metricId: metricGroup.metricId,
              classId: curClass.classId,
              value: NaN,
              geographyId: null,
              sketchId: sketch.properties.id,
              groupId: null,
              extra: {
                isCollection: true,
              },
            });
          else {
            throw err;
          }
        }
      }
    }),
  );

  return {
    metrics: sortMetrics(rekeyMetrics(allMetrics)),
    histogram: histogramData,
  };
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
