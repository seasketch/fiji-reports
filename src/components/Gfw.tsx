import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  ReportError,
  ResultsCard,
  SketchClassTable,
  useSketchProperties,
  ToolbarCard,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import {
  flattenBySketchAllClass,
  GeogProp,
  Metric,
  MetricGroup,
  metricsWithSketchId,
  ReportResult,
  SketchProperties,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import projectClient from "../../project/projectClient.js";
import { GfwLineChart } from "./GfwLineChart.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Gfw component
 */
export const Gfw: React.FunctionComponent<{
  printing: boolean;
  geographyId?: string;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = projectClient.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Labels
  const titleLabel = t("Fishing Effort - Global Fishing Watch");
  const mapLabel = t("Show Fishing Effort 2024 On Map");

  const metricGroup = projectClient.getMetricGroup("gfw");
  const precalcMetrics = projectClient.getPrecalcMetrics(
    metricGroup,
    "sum",
    curGeography.geographyId,
  );

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="gfw" useChildCard>
        {(data: ReportResult) => {
          const percMetricIdName = `${metricGroup.metricId}Perc`;

          const valueMetrics = metricsWithSketchId(
            data.metrics.filter((m) => m.metricId === metricGroup.metricId),
            [id],
          );
          const percentMetrics = toPercentMetric(valueMetrics, precalcMetrics, {
            metricIdOverride: percMetricIdName,
          });

          const percentLineData = percentMetrics.map((m) => ({
            year: Number(m.classId),
            value: m.value,
          }));

          return (
            <ReportError>
              <ToolbarCard
                title={titleLabel}
                items={
                  <DataDownload
                    filename="Gfw"
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
                  <Trans i18nKey="Gfw 1">
                    This report summarizes the percentage of fishing effort
                    contained within this plan from 2018-2024, based on data
                    from Global Fishing Watch.
                  </Trans>
                </p>

                <LayerToggle
                  label={mapLabel}
                  layerId={
                    metricGroup.classes.find(
                      (curClass) => curClass.classId === "2024",
                    )?.layerId
                  }
                />

                {data.metrics.some((d) => d.value !== 0) ? (
                  <GfwLineChart data={percentLineData} />
                ) : (
                  <p
                    style={{
                      color: "#888",
                      fontStyle: "italic",
                      margin: "20px 0",
                    }}
                  >
                    No fishing effort in plan
                  </p>
                )}

                {isCollection && childProperties && (
                  <Collapse
                    title={t("Show by Sketch")}
                    key={props.printing + "Gfw Sketch Collapse"}
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
                  key={props.printing + "Gfw Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="Gfw - learn more">
                    <p>
                      ℹ️ Overview: Global Fishing Watch's apparent fishing
                      effort is based on transmissions broadcast using the
                      automatic identification system (AIS). After identifying
                      fishing vessels and detecting fishing positions in the AIS
                      data, apparent fishing effort is calculated for any area
                      by summarizing the fishing hours for all fishing vessels
                      in that area.
                    </p>
                    <p>🗺️ Source Data: Global Fishing Watch</p>
                    <p>
                      📈 Report: This report calculates the sum of apparent
                      fishing effort within the plan. This value is divided by
                      the total sum of apparent fishing effort to obtain the %
                      contained within the plan.
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
