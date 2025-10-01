import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  KeySection,
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
  firstMatchingMetric,
  flattenBySketchAllClass,
  metricsWithSketchId,
  percentWithEdge,
  roundLower,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Size report
 */
export const Size: React.FunctionComponent<{
  printing: boolean;
  geographyId?: string;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("size", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Size");
  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");
  const unitsLabel = t("ha");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="size" useChildCard>
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

          const areaMetric = firstMatchingMetric(
            data.metrics,
            (m) => m.sketchId === id && m.groupId === null,
          );
          const totalAreaMetric = firstMatchingMetric(
            precalcMetrics,
            (m) => m.groupId === null,
          );
          const areaDisplay = roundLower(areaMetric.value / 10000);
          const percDisplay = percentWithEdge(
            areaMetric.value / totalAreaMetric.value,
          );

          return (
            <ReportError>
              <ToolbarCard
                title={titleLabel}
                items={
                  <DataDownload
                    filename="Size"
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
                  <Trans i18nKey="Size 1">
                    The Fijian Exclusive Economic Zone extends from the
                    shoreline to 200 nautical miles. This report summarizes this
                    plan's overlap with the EEZ, measuring progress towards
                    achieving the objective of 30% protection.
                  </Trans>
                </p>

                <KeySection>
                  {t("This plan is")}{" "}
                  <b>
                    {areaDisplay} {unitsLabel}
                  </b>
                  {", "}
                  {t("which is")} <b>{percDisplay}</b> {t("of the Fijian EEZ")}
                </KeySection>

                <ClassTable
                  rows={metrics}
                  metricGroup={metricGroup}
                  columnConfig={[
                    {
                      columnLabel: " ",
                      type: "class",
                      width: 20,
                    },
                    {
                      columnLabel: withinLabel,
                      type: "metricValue",
                      metricId: metricGroup.metricId,
                      valueFormatter: (v) => roundLower(Number(v) / 10000),
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
                  <Collapse
                    title={t("Show by Sketch")}
                    key={props.printing + "Size Sketch Collapse"}
                    collapsed={!props.printing}
                  >
                    {genSketchTable(
                      data,
                      metricGroup,
                      precalcMetrics,
                      childProperties,
                    )}
                  </Collapse>
                )}

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "Size Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="Size - learn more">
                    <p>🎯 Planning Objective: 30% protection by 2030</p>
                    <p>🗺️ Source Data: Marine Regions v12</p>
                    <p>
                      📈 Report: This report calculates the total area of the
                      plan within the EEZ. This value is divided by the total
                      area of the EEZ to obtain the % contained within the plan.
                      Overlap of sketches is not handled, and overlapping areas
                      will be double counted if drawn. Reach out to the
                      developers if sketch overlap needs to be accounted for.
                    </p>
                  </Trans>
                </Collapse>
              </ToolbarCard>
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
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
