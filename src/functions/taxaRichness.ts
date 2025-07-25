import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Point,
  ReportResult,
  createMetric,
  rekeyMetrics,
  sortMetrics,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { booleanPointInPolygon } from "@turf/turf";
import { splitSketchAntimeridian } from "../util/antimeridian.js";

interface TaxaRichnessProperties {
  station_id?: string;
  coral_genus_richness?: number;
  fish_family_richness?: number;
  invert_genus_richness?: number;
}

interface TaxaRichnessReportResult extends ReportResult {
  stations: {
    station_id?: string;
    coral_genus_richness: number;
    fish_family_richness: number;
    invert_genus_richness: number;
  }[];
  perSketch: {
    sketchId: string;
    sketchName: string;
    coral_genus_richness: number;
    fish_family_richness: number;
    invert_genus_richness: number;
  }[];
}

/**
 * taxaRichness: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function taxaRichness(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<TaxaRichnessReportResult> {
  const splitSketch = splitSketchAntimeridian(sketch);
  const sketchArray = toSketchArray(splitSketch);

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("taxaRichness");

  // Calculate overall metrics (existing logic)
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch
        const features = (await getFeaturesForSketchBBoxes(
          splitSketch,
          url,
        )) as Feature<Point, TaxaRichnessProperties>[];
        const finalFeatures = features.filter((feature) =>
          sketchArray.some((sk) =>
            booleanPointInPolygon(feature.geometry, sk.geometry),
          ),
        );

        const propName = curClass.classId as keyof TaxaRichnessProperties;
        const classValues = finalFeatures.map(
          (feature) => feature.properties[propName] as number,
        );

        const average =
          classValues.reduce((sum, value) => sum + value, 0) /
          classValues.length;

        return {
          metric: createMetric({
            metricId: metricGroup.metricId,
            classId: curClass.classId,
            value: average,
          }),
          stations: finalFeatures.map((feature) => ({
            station_id: feature.properties.station_id!,
            [propName]: feature.properties[propName] as number,
          })),
        };
      }),
    )
  ).flat();

  // Calculate per sketch metrics
  const perSketchMetrics: TaxaRichnessReportResult["perSketch"] = [];

  for (const individualSketch of sketchArray) {
    const sketchMetrics = await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with this specific sketch
        const features = (await getFeaturesForSketchBBoxes(
          individualSketch,
          url,
        )) as Feature<Point, TaxaRichnessProperties>[];
        const finalFeatures = features.filter((feature) =>
          booleanPointInPolygon(feature.geometry, individualSketch.geometry),
        );

        const propName = curClass.classId as keyof TaxaRichnessProperties;
        const classValues = finalFeatures.map(
          (feature) => feature.properties[propName] as number,
        );

        const average =
          classValues.length > 0
            ? classValues.reduce((sum, value) => sum + value, 0) /
              classValues.length
            : 0;

        return {
          classId: curClass.classId,
          value: average,
        };
      }),
    );

    // Combine metrics for this sketch
    const sketchResult = {
      sketchId: individualSketch.properties?.sketchId || individualSketch.id,
      sketchName: String(
        individualSketch.properties?.name || individualSketch.id,
      ),
      coral_genus_richness: 0,
      fish_family_richness: 0,
      invert_genus_richness: 0,
    };

    sketchMetrics.forEach((metric) => {
      const propName = metric.classId as keyof TaxaRichnessProperties;
      if (propName in sketchResult) {
        (sketchResult as any)[propName] = metric.value;
      }
    });

    perSketchMetrics.push(sketchResult);
  }

  // Combine all stations and merge their properties
  const stations: TaxaRichnessReportResult["stations"] = [];
  metrics.forEach(({ stations: classStations }) => {
    classStations.forEach((station) => {
      const existingStation = stations.find(
        (s) => s.station_id === station.station_id,
      );
      if (existingStation) {
        Object.assign(existingStation, station);
      } else {
        const { station_id, ...stationData } = station;
        stations.push({
          station_id,
          coral_genus_richness: 0,
          fish_family_richness: 0,
          invert_genus_richness: 0,
          ...stationData,
        });
      }
    });
  });

  return {
    metrics: sortMetrics(rekeyMetrics(metrics.map((m) => m.metric))),
    stations,
    perSketch: perSketchMetrics,
  };
}

export default new GeoprocessingHandler(taxaRichness, {
  title: "taxaRichness",
  description: "taxaRichness",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
