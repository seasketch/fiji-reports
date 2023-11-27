import {
  Sketch,
  Feature,
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  SketchCollection,
  toNullSketch,
  rekeyMetrics,
  sortMetrics,
  isPolygonFeatureArray,
  getFirstFromParam,
  DefaultExtraParams,
  splitSketchAntimeridian,
  overlapRaster,
  isRasterDatasource,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import project from "../../project";
import { clipToGeography } from "../util/clipToGeography";

const metricGroup = project.getMetricGroup("testRasterOverlap");

/**
 * Demonstrates raster geoprocessing function that supports antimeridian crossing
 */
export async function testRasterOverlap(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
  extraParams: DefaultExtraParams = {}
): Promise<ReportResult> {
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });
  const splitSketch = splitSketchAntimeridian(sketch);
  const clippedSketch = await clipToGeography(splitSketch, curGeography);

  // Fetch features indexed by classId
  const metrics: Metric[] = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        if (!curClass.datasourceId) {
          throw new Error(`Missing datasourceId ${curClass.classId}`);
        }
        const ds = project.getDatasourceById(curClass.datasourceId);
        if (!isRasterDatasource(ds)) {
          throw new Error(`Expected raster datasource for ${ds.datasourceId}`);
        }

        const url = project.getDatasourceUrl(ds);
        const raster = await loadCog(url);

        const overlapResult = await overlapRaster(
          metricGroup.metricId,
          raster,
          clippedSketch
        );

        return overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
            classId: curClass.classId,
            geographyId: curGeography.geographyId,
          })
        );
      })
    )
  ).reduce(
    // merge
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(testRasterOverlap, {
  title: "testRasterOverlap",
  description: "Calculate sketch overlap with boundary polygons",
  executionMode: "async",
  timeout: 40,
  requiresProperties: [],
  memory: 10240,
});
