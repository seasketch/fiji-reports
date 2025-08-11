import {
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  toSketchArray,
  toRasterProjection,
  isSketchCollection,
  MultiPolygon,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import { min, max } from "simple-statistics";
import project from "../../project/projectClient.js";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

// @ts-expect-error no types
import geoblaze, { Georaster } from "geoblaze";

export interface BathymetryResults {
  min: number;
  max: number;
  mean?: number;
  units: string;
  sketchName?: string;
  isCollection?: boolean;
}

export async function bathymetry(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<BathymetryResults[]> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const mg = project.getMetricGroup("bathymetry");
  const dsId = mg.datasourceId;

  if (!dsId) throw new Error(`Expected datasourceId for ${mg}`);

  const ds = project.getDatasourceById(dsId);
  const url = project.getDatasourceUrl(ds);

  const bathymetry = await loadCog(url);
  const stats = await bathyStats(splitSketch, bathymetry);

  if (!stats)
    throw new Error(`No stats returned for ${sketch.properties.name}`);

  return stats;
}

/**
 * Core raster analysis - given raster, counts number of cells with value that are within Feature polygons
 */
export async function bathyStats(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  bathymetry: Georaster,
): Promise<BathymetryResults[]> {
  const features = toSketchArray(sketch);

  const sketchStats: BathymetryResults[] = await Promise.all(
    features.map(async (feature) => {
      const finalFeat = toRasterProjection(bathymetry, feature);
      try {
        const stats = (
          await geoblaze.stats(bathymetry, finalFeat, {
            calcMax: true,
            calcMean: true,
            calcMin: true,
          })
        )[0];
        return {
          min: stats.min,
          max: stats.max,
          mean: stats.mean,
          units: "meters",
          sketchName: finalFeat.properties.name,
        };
      } catch (err) {
        if (err === "No Values were found in the given geometry") {
          return {
            min: null,
            mean: null,
            max: null,
            units: "meters",
            sketchName: finalFeat.properties.name,
          };
        } else {
          throw err;
        }
      }
    }),
  );

  if (isSketchCollection(sketch)) {
    const minVal = min(sketchStats.map((s) => s.min).filter(notNull));
    const maxVal = max(sketchStats.map((s) => s.max).filter(notNull));

    // Restrict values to be <= 0
    return sketchStats.concat([
      {
        min: minVal > 0 ? 0 : minVal,
        max: maxVal > 0 ? 0 : maxVal,
        units: "meters",
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    ]);
  } else return sketchStats;
}

function notNull(value: number): value is number {
  return value !== null && value !== undefined;
}

export default new GeoprocessingHandler(bathymetry, {
  title: "bathymetry",
  description: "calculates bathymetry within given sketch",
  timeout: 500,
  executionMode: "async",
  requiresProperties: [],
  memory: 8192,
});
