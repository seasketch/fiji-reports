import datasources from "./datasources.json";
import metrics from "./metrics.json";
import objectives from "./objectives.json";
import basic from "./basic.json";
import projectPackage from "../package.json";
import gp from "../geoprocessing.json";

import {
  Datasources,
  Datasource,
  datasourcesSchema,
  InternalVectorDatasource,
  Stats,
  InternalRasterDatasource,
} from "../src/util/datasources/types";
import {
  getDatasourceById,
  getInternalRasterDatasourceById,
  getInternalVectorDatasourceById,
} from "../src/util/datasources/helpers";
import {
  getObjectiveById,
  newObjectiveToLegacy,
} from "../src/util/objectives/helpers";
import {
  MetricGroup,
  MetricGroups,
  metricGroupsSchema,
} from "../src/util/metrics/types";
import {
  ObjectiveNew,
  ObjectivesNew,
  objectivesSchema,
} from "../src/util/objectives/types";
import {
  DataClass,
  DataGroup,
  GeoprocessingJsonConfig,
  Metric,
  MetricGroup as MetricGroupLegacy,
} from "@seasketch/geoprocessing";

import {
  getLandVectorDatasource as getGlobalLandVectorDatasource,
  getEezVectorDatasource as getGlobalEezVectorDatasource,
  getGlobalVectorDatasourceById,
} from "../src/util/datasources/global";
import { Package } from "@seasketch/geoprocessing/dist/scripts";
import { Project, projectSchema } from "../src/util/project/types";

/**
 * Client for reading project configuration/metadata.
 */
export class ProjectClient {
  private static _instance: ProjectClient = new ProjectClient();

  private _project: Project = projectSchema.parse(basic);
  private _datasources: Datasources = datasourcesSchema.parse(datasources);
  private _metrics: MetricGroups = metricGroupsSchema.parse(metrics);
  private _objectives: ObjectivesNew = objectivesSchema.parse(objectives);
  // ToDo: add zod schema and validate
  private _package: Package = projectPackage as Package;
  // ToDo: add zod schema and validate
  private _geoprocessing: GeoprocessingJsonConfig = gp;

  constructor() {
    if (ProjectClient._instance) {
      throw new Error(
        "Error: Instantiation failed: Use ProjectClient.getInstance() instead of new."
      );
    }
    ProjectClient._instance = this;
  }

  public static getInstance(): ProjectClient {
    return ProjectClient._instance;
  }

  // ASSETS //

  /** Returns typed config from project.json */
  public get basic(): Project {
    return this._project;
  }

  /** Returns typed config from datasources.json */
  public get datasources(): Datasources {
    return this._datasources;
  }

  /** Returns typed config from metrics.json */
  public get metrics(): MetricGroups {
    return this._metrics;
  }

  /** Returns typed config from objectives.json */
  public get objectives(): ObjectivesNew {
    return this._objectives;
  }

  /** Returns typed config from package.json */
  public get package(): Package {
    return this._package;
  }

  /** Returns typed config from geoprocessing.json */
  public get geoprocessing(): GeoprocessingJsonConfig {
    return this._geoprocessing;
  }

  /**
   * Returns URL to dataset bucket for project.  In test environment or if local parameter is true, will
   * return local URL expected to serve up dist data folder
   */
  public dataBucketUrl(local: boolean = false, port: number = 8080) {
    return process.env.NODE_ENV === "test" || local
      ? `http://127.0.0.1:${port}/`
      : `https://gp-${this._package.name}-datasets.s3.${this._geoprocessing.region}.amazonaws.com/`;
  }

  // HELPERS //

  /** Returns Datasource given datasourceId */
  public getDatasourceById(datasourceId: string): Datasource {
    return getDatasourceById(datasourceId, this._datasources);
  }

  /** Returns InternalVectorDatasource given datasourceId, throws if not found */
  public getInternalVectorDatasourceById(
    datasourceId: string
  ): InternalVectorDatasource {
    return getInternalVectorDatasourceById(datasourceId, this._datasources);
  }

  /** Returns InternalRasterDatasource given datasourceId, throws if not found */
  public getInternalRasterDatasourceById(
    datasourceId: string
  ): InternalRasterDatasource {
    return getInternalRasterDatasourceById(datasourceId, this._datasources);
  }

  /** Returns global VectorDatasource given datasourceId */
  public getGlobalVectorDatasourceById(datasourceId: string) {
    return getGlobalVectorDatasourceById(datasourceId, this._datasources);
  }

  /** Returns global land VectorDatasource */
  public getGlobalLandVectorDatasource() {
    return getGlobalLandVectorDatasource(this._datasources);
  }

  /** Returns global eez VectorDatasource */
  public getGlobalEezVectorDatasource() {
    return getGlobalEezVectorDatasource(this._datasources);
  }

  // OBJECTIVES //

  /** Returns Objective given objectiveId */
  public getObjectiveById(objectiveId: string): ObjectiveNew {
    return getObjectiveById(objectiveId, this._objectives);
  }

  // METRICS //

  public getMetricGroup(metricId: string): MetricGroup {
    const mg = this._metrics.find((m) => m.metricId === metricId);
    if (!mg) throw new Error(`Missing MetricGroup ${metricId} in metrics.json`);

    return mg;
  }

  public getLegacyMetricGroup(metricId: string): MetricGroupLegacy {
    const mg = this.getMetricGroup(metricId);
    const topObjective = mg.objectiveId
      ? newObjectiveToLegacy(this.getObjectiveById(mg.objectiveId))
      : undefined;

    const legacyMg: MetricGroupLegacy = {
      ...mg,
      classes: mg.classes.map((curClass) => {
        const target = curClass.objectiveId
          ? this.getObjectiveById(curClass.objectiveId).target
          : topObjective
          ? topObjective.target
          : undefined;
        return {
          ...curClass,
          goalValue: target,
        };
      }),
      ...({ objective: topObjective } || {}),
    };

    return legacyMg;
  }

  /** Returns Metrics for given MetricGroup stat precalcuated on import (keyStats) */
  public getPrecalcMetrics(
    mg: MetricGroup,
    /** The stat name to return - area, count */
    statName: keyof Stats,
    /** Optional class key to use */
    classKey?: string
  ): Metric[] {
    // top-level datasource with multi-class
    // class-level datasource single-class (use total)
    // class-level datasource multi-class (use total)
    // class-level multi-datasource single-class and multi-class

    const metrics = mg.classes.map((curClass) => {
      if (!mg.datasourceId && !curClass.datasourceId)
        throw new Error(`Missing datasourceId for ${mg.metricId}`);
      const ds = this.getDatasourceById(
        mg.datasourceId! || curClass.datasourceId!
      );
      if (!ds.keyStats)
        throw new Error(`Expected keyStats for ${ds.datasourceId}`);
      const classKey = mg.classKey! || curClass.classKey!;
      // If not class key use the total
      const classValue = classKey
        ? ds.keyStats[classKey][curClass.classId][statName]
        : ds.keyStats.total.total[statName];
      if (!classValue)
        throw new Error(
          `Expected total ${statName} stat for ${ds.datasourceId} ${curClass.classId}`
        );
      const classMetric = {
        groupId: null,
        geographyId: null,
        sketchId: null,
        metricId: mg.metricId,
        classId: curClass.classId,
        value: classValue,
      };
      return classMetric;
    });
    return metrics;

    /**
    if (mg.datasourceId && classKey) {
      // top-level datasource, multi-class
      const ds = this.getDatasourceById(mg.datasourceId);
      const metrics = mg.classes.map((curClass) => {
        if (!ds.keyStats)
          throw new Error(`Expected keyStats for ${ds.datasourceId}`);
        const classValue = ds.keyStats[classKey][curClass.classId][statName];
        if (!classValue)
          throw new Error(
            `Expected total ${statName} stat for ${ds.datasourceId} ${curClass.classId}`
          );
        const classMetric = {
          groupId: null,
          geographyId: null,
          sketchId: null,
          metricId: mg.metricId,
          classId: curClass.classId,
          value: classValue,
        };
        return classMetric;
      });
      return metrics;
    } else if (mg.classes[0].datasourceId) {
      // class-level datasources, single-class each
      const metrics = mg.classes
        .map((curClass) => {
          if (!curClass.datasourceId) {
            throw new Error(`Missing datasourceId ${mg.metricId}`);
          }
          const ds = this.getDatasourceById(curClass.datasourceId);
          if (!ds.keyStats)
            throw new Error(`Expected keyStats for ${ds.datasourceId}`);
          // Grab the total
          const classValue = ds.keyStats.total.total[statName];
          if (!classValue)
            throw new Error(
              `Expected total ${statName} stat for ${ds.datasourceId} ${curClass.classId}`
            );
          // single metric return, one per class
          return [
            {
              groupId: null,
              geographyId: null,
              sketchId: null,
              metricId: mg.metricId,
              classId: curClass.classId,
              value: classValue,
            },
          ];
        })
        .reduce<Metric[]>((metricsSoFar, curClassMetrics) => {
          return metricsSoFar.concat(curClassMetrics);
        }, []);

      return metrics;
    }
    throw new Error(`Missing datasourceId(s) in MetricGroup ${mg.metricId}`);
    */
  }
}

const project = ProjectClient.getInstance();
export default project;
