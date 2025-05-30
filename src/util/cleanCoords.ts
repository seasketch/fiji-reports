import { BBox, Position } from "geojson";
import { feature, featureCollection, getCoords, getType } from "@turf/turf";
import { cleanBBox } from "@seasketch/geoprocessing";

/**
 * Cleans geojson coordinates to be within the bounds of the world [-90, -180, 90, 180], so that they don't wrap off the end, and can be split
 * @param geojson
 * @param options
 * @param options.mutate whether or not to mutate the coordinates in place, defaults to false
 */
export function cleanCoords(
  geojson: any,
  options: {
    mutate?: boolean;
  } = {},
) {
  const mutate = typeof options === "object" ? options.mutate : options;
  if (!geojson) throw new Error("geojson is required");
  const type = getType(geojson);

  // Store new "clean" points in this Array
  let newCoords: any = [];

  switch (type) {
    case "FeatureCollection": {
      const cleanedCollection = featureCollection(
        geojson.features.map((f) => cleanCoords(f))
      );
      if (geojson.properties) {
        // @ts-expect-error - is this is a sketch collection we want to transfer collection-level properties
        cleanedCollection.properties = geojson.properties;
      }
      return cleanedCollection;
    }
    case "LineString": {
      newCoords = cleanLine(geojson);
      break;
    }
    case "MultiLineString":
    case "Polygon": {
      for (const line of getCoords(geojson)) {
        newCoords.push(cleanLine(line));
      }
      break;
    }
    case "MultiPolygon": {
      getCoords(geojson).forEach(function (polygons: any) {
        const polyPoints: Position[] = [];
        polygons.forEach(function (ring: Position[]) {
          polyPoints.push(cleanLine(ring));
        });
        newCoords.push(polyPoints);
      });
      break;
    }
    case "Point": {
      return geojson;
    }
    case "MultiPoint": {
      const existing: Record<string, true> = {};
      getCoords(geojson).forEach(function (coord: any) {
        const key = coord.join("-");
        if (!Object.prototype.hasOwnProperty.call(existing, key)) {
          newCoords.push(coord);
          existing[key] = true;
        }
      });
      break;
    }
    default: {
      throw new Error(type + " geometry not supported");
    }
  }

  // Support input mutation
  if (geojson.coordinates) {
    if (mutate === true) {
      geojson.coordinates = newCoords;
      return geojson;
    }
    return { type: type, coordinates: newCoords };
  } else {
    if (mutate === true) {
      geojson.geometry.coordinates = newCoords;
      return geojson;
    }
    return feature({ type: type, coordinates: newCoords }, geojson.properties, {
      bbox: cleanBBox(geojson.bbox) as BBox,
      id: geojson.id,
    });
  }
}

/**
 * Clean line
 * @param {Array<number>|LineString} line Line
 * @param {string} type Type of geometry
 * @returns {Array<number>} Cleaned coordinates
 */
function cleanLine(line: Position[]): any[] {
  const points = getCoords(line);
  const newPoints: number[][] = [];
  for (const point of points) {
    const newPoint = [longitude(point[0]), latitude(point[1])];
    newPoints.push(newPoint);
  }
  return newPoints;
}

/**
 * Clean latitude coordinate
 * @param lat
 * @returns latitude value within -90 to 90
 */
function latitude(lat: number) {
  if (lat === undefined || lat === null) throw new Error("lat is required");

  // Latitudes cannot extends beyond +/-90 degrees
  if (lat > 90 || lat < -90) {
    lat = lat % 180;
    if (lat > 90) lat = -180 + lat;
    if (lat < -90) lat = 180 + lat;
    if (lat === 0) lat = Math.abs(lat); // make sure not negative zero
  }
  return lat;
}

/**
 * Clean longitude coordinate
 * @param lng
 * @returns longitude value within -180 to 180
 */
function longitude(lng: number) {
  if (lng === undefined || lng === undefined)
    throw new Error("lng is required");

  // lngitudes cannot extends beyond +/-90 degrees
  if (lng > 180 || lng < -180) {
    lng = lng % 360;
    if (lng > 180) lng = -360 + lng;
    if (lng < -180) lng = 360 + lng;
    if (lng === 0) lng = Math.abs(lng); // make sure not negative zero
  }
  return lng;
}
