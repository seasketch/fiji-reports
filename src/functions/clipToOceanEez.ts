import {
  ValidationError,
  PreprocessingHandler,
  isPolygonFeature,
  Feature,
  Polygon,
  MultiPolygon,
  clip,
  isMultiPolygonFeature,
} from "@seasketch/geoprocessing";
import area from "@turf/area";
import bbox from "@turf/bbox";
import { featureCollection as fc, multiPolygon } from "@turf/helpers";
import flatten from "@turf/flatten";
import kinks from "@turf/kinks";
import { clipMultiMerge } from "@seasketch/geoprocessing";
import splitGeojson from "geojson-antimeridian-cut";
import { cleanCoords } from "../util/cleanCoords";

import {
  getLandVectorDatasource,
  getEezVectorDatasource,
} from "../util/datasources/global";
import project from "../../project";
import { datasourcesSchema } from "../util/datasources/types";
import {
  getFlatGeobufFilename,
  isInternalVectorDatasource,
} from "../util/datasources/helpers";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";

const ENFORCE_MAX_SIZE = false;
const MAX_SIZE_KM = 500000 * 1000 ** 2; // Default 500,000 KM

const ds = project.getDatasourceById("land");

// Defined at module level for potential caching/reuse by serverless process
const datasources = datasourcesSchema.parse(project.datasources);
const landDatasource = getLandVectorDatasource(datasources);
const eezDatasource = getEezVectorDatasource(datasources);

export async function clipLand(feature: Feature<Polygon | MultiPolygon>) {
  const landFeatures = await landDatasource.fetchUnion(bbox(feature), "gid");
  if (landFeatures.features.length === 0) return feature;
  return clip(fc([feature, ...landFeatures.features]), "difference");
}

export async function clipCoastline(feature: Feature<Polygon | MultiPolygon>) {
  if (!isInternalVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = `${project.dataBucketUrl()}${getFlatGeobufFilename(ds)}`;
  // Fetch for entire project area, we want the whole thing
  const polys = await fgbFetchAll<Feature<Polygon>>(url);
  return clipMultiMerge(feature, fc(polys), "intersection");
}

export async function clipOutsideEez(
  feature: Feature<Polygon | MultiPolygon>,
  eezFilterByNames: string[] = ["Fiji"]
) {
  let eezFeatures = await eezDatasource.fetch(bbox(feature));
  if (eezFeatures.length === 0) return feature;
  // Optionally filter down to a single country/union EEZ boundary
  if (eezFilterByNames.length > 0) {
    eezFeatures = eezFeatures.filter((e) =>
      eezFilterByNames.includes(e.properties.UNION)
    );
  }
  return clipMultiMerge(feature, fc(eezFeatures), "intersection");
}

/**
 * Takes a Polygon feature and returns the portion that is in the ocean and within an EEZ boundary
 * If results in multiple polygons then returns the largest
 */
// export async function clipToOceanEez(
//   feature: Feature,
//   eezFilterByNames?: string[]
// ): Promise<Feature> {
//   if (!isPolygonFeature(feature)) {
//     throw new ValidationError("Input must be a polygon");
//   }

//   if (ENFORCE_MAX_SIZE && area(feature) > MAX_SIZE_KM) {
//     throw new ValidationError(
//       `Please limit sketches to under ${MAX_SIZE_KM} square km`
//     );
//   }

//   const kinkPoints = kinks(feature);
//   if (kinkPoints.features.length > 0) {
//     throw new ValidationError("Your sketch polygon crosses itself.");
//   }

//   let clipped = await clipLand(feature);
//   if (clipped) clipped = await clipOutsideEez(clipped, eezFilterByNames);

//   if (!clipped || area(clipped) === 0) {
//     throw new ValidationError("Sketch is outside of project boundaries");
//   } else {
//     if (clipped.geometry.type === "MultiPolygon") {
//       const flattened = flatten(clipped);
//       let biggest = [0, 0];
//       for (var i = 0; i < flattened.features.length; i++) {
//         const a = area(flattened.features[i]);
//         if (a > biggest[0]) {
//           biggest = [a, i];
//         }
//       }
//       return flattened.features[biggest[1]] as Feature<Polygon>;
//     } else {
//       return clipped;
//     }
//   }
// }

/**
 * Takes a Polygon feature and returns the portion that is in the ocean and within an EEZ boundary
 * If results in multiple polygons then returns the largest
 */
export async function clipToOceanEez(
  feature: Feature,
  eezFilterByNames?: string[]
): Promise<Feature> {
  if (!isPolygonFeature(feature)) {
    throw new ValidationError("Input must be a polygon");
  }

  // if (area(feature) > MAX_SIZE) {
  //   throw new ValidationError(
  //     "Please limit sketches to under 100,000,000 square km"
  //   );
  // }

  // const kinkPoints = kinks(feature);
  // if (kinkPoints.features.length > 0) {
  //   throw new ValidationError("Your sketch polygon crosses itself.");
  // }

  // Ensure coordinate positions are within -180 to 180 longitude, -90 to 90 latitude
  const cleanFeature = cleanCoords(feature) as Feature<Polygon | MultiPolygon>;

  // Split sketch on antimeridian.  If it doesn't cross simply returns original polygon
  const splitOrNotFeature = splitGeojson(cleanFeature);

  let clipped = await clipLand(splitOrNotFeature);
  // if (clipped) clipped = await clipOutsideEez(clipped, eezFilterByNames);

  if (!clipped || area(clipped) === 0) {
    throw new ValidationError("Sketch is outside of project boundaries");
  } else {
    if (clipped.geometry.type === "MultiPolygon") {
      // If clipping produces a multipolygon, keep its biggest polygon
      // But if sketch was split on antimeridian, then keep its two biggest polygons (assuming one on each side)
      const numPolysToKeep = isMultiPolygonFeature(splitOrNotFeature) ? 2 : 1;

      const flattened = flatten(clipped);
      const polysByArea = flattened.features
        .map((poly) => ({ poly, area: area(poly) }))
        .sort((a, b) => b.area - a.area);
      if (numPolysToKeep === 1) {
        return polysByArea[0].poly as Feature<Polygon>;
      } else {
        // must be 2 to keep
        // if (booleanIntersects(polysByArea[0].poly, polysByArea[1].poly)) {
        return multiPolygon([
          polysByArea[0].poly.geometry.coordinates,
          polysByArea[1].poly.geometry.coordinates,
        ]);
        // } else {
        // if the two largest polys don't share at least one common point (as would happen with a clean antimeridian cut)
        // then must have hit an edge case such as sketch splitting across land and the antimeridian
        // so just return the largest polygons
        // return polysByArea[0].poly;
        // }
      }
    } else {
      return clipped;
    }
  }
}

export default new PreprocessingHandler(clipToOceanEez, {
  title: "clipToOceanEez",
  description:
    "Erases portion of sketch overlapping with land or extending into ocean outsize EEZ boundary",
  timeout: 40,
  requiresProperties: [],
});
