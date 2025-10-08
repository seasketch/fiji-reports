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

export async function pristineSeas(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<ReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("pristineSeas");
  const allMetrics: Metric[] = [];

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
            console.log(stats);
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
