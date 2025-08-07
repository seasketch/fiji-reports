import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  ReportError,
  ResultsCard,
  SketchClassTable,
  useSketchProperties,
  ToolbarCard,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  roundDecimalFormat,
  sortMetrics,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Geomorphology report
 */
export const Geomorphology: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("geomorphology", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Geomorphology");
  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");
  const unitsLabel = t("ha");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="geomorphology"
      extraParams={{ geographyIds: [curGeography.geographyId] }}
      useChildCard
    >
      {(data: ReportResult) => {
        const percMetricIdName = `${metricGroup.metricId}Perc`;

        const valueMetrics = metricsWithSketchId(
          data.metrics.filter((m) => m.metricId === metricGroup.metricId),
          [id],
        );
        const percentMetrics = toPercentMetric(valueMetrics, precalcMetrics, {
          metricIdOverride: percMetricIdName,
        });
        const metrics = [...valueMetrics, ...percentMetrics];

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <DataDownload
                  filename="Geomorphology"
                  data={data.metrics}
                  formats={["csv", "json"]}
                  placement="left-start"
                  titleElement={
                    <Download
                      size={18}
                      color="#999"
                      style={{ cursor: "pointer" }}
                    />
                  }
                />
              }
            >
              <p>
                <Trans i18nKey="Geomorphology 1">
                  This report summarizes this plan's overlap with geomorphic
                  features in Fiji's EEZ.
                </Trans>
              </p>

              <ClassTable
                rows={sortMetrics(metrics, ["groupId"])}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: " ",
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: withinLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (val) =>
                      roundDecimalFormat(Number(val) / 10000),
                    valueLabel: unitsLabel,
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 20,
                  },
                  {
                    columnLabel: percWithinLabel,
                    type: "metricChart",
                    metricId: percMetricIdName,
                    valueFormatter: "percent",
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 40,
                  },
                  {
                    columnLabel: mapLabel,
                    type: "layerToggle",
                    width: 10,
                  },
                ]}
              />

              {isCollection && childProperties && (
                <Collapse title={t("Show by Sketch")}>
                  {genSketchTable(
                    data,
                    metricGroup,
                    precalcMetrics,
                    childProperties,
                  )}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Geomorphology - learn more">
                  <p>
                    🗺️ Source Data:{" "}
                    <a
                      href="https://vanuagis.lands.gov.fj/arcgis/rest/services/Oceans/Physical/MapServer"
                      target="_blank"
                    >
                      Vanua GIS
                    </a>
                  </p>
                  <p>
                    📈 Report: This report calculates the total area of each
                    geomorphological feature within the plan. This value is
                    divided by the total area of each geomorphological feature
                    to obtain the % contained within the plan. Overlap of
                    sketches is not handled, and overlapping areas will be
                    double counted if drawn. Reach out to the developers if
                    sketch overlap needs to be accounted for.
                  </p>
                </Trans>
              </Collapse>
            </ToolbarCard>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  precalcMetrics: Metric[],
  childProperties: SketchProperties[],
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === metricGroup.metricId),
      childSketchIds,
    ),
    precalcMetrics,
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return (
    <SketchClassTable rows={sketchRows} metricGroup={metricGroup} formatPerc />
  );
};
