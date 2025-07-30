import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isRasterDatasource,
  loadCog,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import { toSketchArray } from "@seasketch/geoprocessing/client-core";

// @ts-expect-error no types
import geoblaze from "geoblaze";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

export interface DHWResults {
  min: number | null;
  max: number | null;
  mean: number | null;
  year: number;
}

/**
 * dhw: A geoprocessing function that calculates degree heating weeks
 */
export async function dhw(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<DHWResults[]> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const sketchArray = toSketchArray(splitSketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("dhw");
  const metrics: DHWResults[] = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isRasterDatasource(ds))
          throw new Error(`Expected raster datasource for ${ds.datasourceId}`);

        const url = project.getDatasourceUrl(ds);
        const raster = await loadCog(url);

        // Calculate stats for each sketch in the collection
        const sketchStats = await Promise.all(
          sketchArray.map(async (sk) => {
            try {
              const stats = (
                await geoblaze.stats(raster, sk, {
                  calcMax: true,
                  calcMean: true,
                  calcMin: true,
                })
              )[0];
              return {
                min: stats.min !== undefined ? stats.min : null,
                max: stats.max !== undefined ? stats.max : null,
                mean: stats.mean !== undefined ? stats.mean : null,
              };
            } catch (err) {
              if (err === "No Values were found in the given geometry") {
                return {
                  min: null,
                  mean: null,
                  max: null,
                };
              } else {
                throw err;
              }
            }
          }),
        );

        // Aggregate stats across all sketches in the collection
        const validStats = sketchStats.filter(
          (stat) =>
            stat.min !== null && stat.max !== null && stat.mean !== null,
        );

        if (validStats.length === 0) {
          return {
            min: null,
            mean: null,
            max: null,
            year: Number(curClass.classId),
          };
        }

        // Calculate aggregate statistics
        const min = Math.min(...validStats.map((stat) => stat.min!));
        const max = Math.max(...validStats.map((stat) => stat.max!));
        const mean =
          validStats.reduce((sum, stat) => sum + stat.mean!, 0) /
          validStats.length;

        return {
          min,
          max,
          mean,
          year: Number(curClass.classId),
        };
      }),
    )
  ).flat();

  return metrics;
}

export default new GeoprocessingHandler(dhw, {
  title: "dhw",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
