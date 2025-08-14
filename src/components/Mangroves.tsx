import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  DataDownload,
  KeySection,
  LayerToggle,
  ReportError,
  ResultsCard,
  ToolbarCard,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  ReportResult,
  firstMatchingMetric,
  percentWithEdge,
  roundDecimalFormat,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";
import { MangrovesLineChart } from "./MangrovesLineChart.js";

/**
 * Mangroves component
 */
export const Mangroves: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("mangroves", t);
  const precalcMetric = {
    geographyId: "world",
    metricId: "area",
    classId: "2020",
    sketchId: null,
    groupId: null,
    value: 45824445.182033, // total: 487056197.5336999,
  };
  // Labels
  const titleLabel = t("Mangroves - Global Mangrove Watch");
  const unitsLabel = t("ha");

  return (
    <ResultsCard title={titleLabel} functionName="mangroves" useChildCard>
      {(data: ReportResult) => {
        const percMetricIdName = `${metricGroup.metricId}Perc`;

        // Gather all yearly area metrics for mangroves
        const yearlyMetrics = metricGroup.classes
          .map((cls) => {
            const m = data.metrics.find(
              (m) =>
                m.metricId === metricGroup.metricId &&
                m.classId === cls.classId,
            );
            return m
              ? {
                  year: Number(cls.classId),
                  area: m.value / 10000,
                }
              : null;
          })
          .filter(Boolean) as { year: number; area: number }[];

        // Prepare data for the mangrove line chart (year, area)
        const mangroveLineData = yearlyMetrics.map((d) => ({
          year: d.year,
          area: d.area,
        }));

        const valueMetric2020 = firstMatchingMetric(
          data.metrics,
          (m) => m.metricId === metricGroup.metricId && m.classId === "2020",
        );
        const percentMetric2020 = toPercentMetric(
          [valueMetric2020],
          [precalcMetric],
          {
            metricIdOverride: percMetricIdName,
          },
        );

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <DataDownload
                  filename="Mangroves"
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
                <Trans i18nKey="Mangroves 1">
                  This report summarizes overlap with mangrove extent, based on
                  Global Mangrove Watch data.
                </Trans>
              </p>

              {data.metrics.some((d) => d.value !== 0) ? (
                <>
                  <KeySection>
                    In 2020, this area of interest contained{" "}
                    {roundDecimalFormat(valueMetric2020.value / 10000)}{" "}
                    {unitsLabel}, which was{" "}
                    {percentWithEdge(percentMetric2020[0].value)} of Fiji's
                    mangrove habitat.
                  </KeySection>
                  <LayerToggle
                    layerId={metricGroup.layerId}
                    label={t("Show 2020 Mangrove Extent On Map")}
                  />
                  <MangrovesLineChart
                    data={mangroveLineData}
                    width={450}
                    height={300}
                  />
                </>
              ) : (
                <p
                  style={{
                    color: "#888",
                    fontStyle: "italic",
                    margin: "20px 0",
                  }}
                >
                  No mangroves contained in area of interest
                </p>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Mangroves - learn more">
                  <p>🗺️ Source Data: Global Mangrove Watch</p>
                  <p>
                    📈 Report: This report calculates the total area of
                    mangroves within the zone. This value is divided by the
                    total area of mangroves to obtain the % contained within the
                    zone. Only mangroves which fall within the planning region
                    are counted in this report.
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
