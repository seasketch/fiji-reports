import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  LayerToggle,
  ReportError,
  ResultsCard,
  ToolbarCard,
  useSketchProperties,
  DataDownload,
  Pill,
  Table,
} from "@seasketch/geoprocessing/client-ui";
import { Download } from "@styled-icons/bootstrap/Download";
import { TFunction } from "i18next";
import {
  Metric,
  ReportResult,
  MetricGroup,
  SketchProperties,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

// Calculate weighted average and min/max from marxan metrics
const calculateMarxanStats = (metrics: Metric[]) => {
  if (!metrics || metrics.length === 0) {
    return { min: 0, max: 0, mean: 0 };
  }

  // Convert classId to numbers and calculate weighted average
  const totalArea = metrics.reduce((sum, metric) => sum + metric.value, 0);
  const weightedSum = metrics.reduce((sum, metric) => {
    const rating = parseFloat(metric.classId || "-1");
    if (rating === -1) throw new Error("Invalid rating, check marxan metrics");
    return sum + rating * metric.value;
  }, 0);

  const mean = totalArea > 0 ? weightedSum / totalArea : 0;

  // Find min and max ratings (only for metrics with non-zero area)
  const ratings = metrics
    .filter((metric) => metric.value > 0) // Only consider metrics with area > 0
    .map((metric) => (metric.classId ? parseFloat(metric.classId) : 0))
    .filter((rating) => !isNaN(rating));

  if (ratings.length === 0) {
    return { min: 0, max: 0, mean: 0 };
  }

  const min = Math.min(...ratings);
  const max = Math.max(...ratings);

  return { min, max, mean };
};

/**
 * Marxan report
 */
export const Marxan: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const metricGroup = project.getMetricGroup("marxan", t);

  // Labels
  const titleLabel = t("Prioritization");

  return (
    <ResultsCard title={titleLabel} functionName="marxan" useChildCard>
      {(data: ReportResult) => {
        // Calculate overall stats from all metrics
        const overallStats = calculateMarxanStats(
          data.metrics.filter((m) => m.sketchId === id),
        );

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <>
                  <DataDownload
                    filename="marxan"
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
                </>
              }
            >
              <p>
                This area of interest has an average prioritization score of{" "}
                <Pill>{overallStats.mean.toFixed(2)}</Pill>, and contains areas
                within the range of <Pill>{overallStats.min}</Pill> to{" "}
                <Pill>{overallStats.max}</Pill>.
              </p>

              <LayerToggle
                layerId={"794A0SDQ3"}
                label={t("Show Inshore Priority Areas")}
              />
              <LayerToggle
                layerId={"thx4JZZtC"}
                label={t("Show Offshore Priority Areas")}
              />

              {isCollection && childProperties && (
                <Collapse title={t("Show by Sketch")}>
                  {genSketchSummary(data, metricGroup, childProperties, t)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="marxan - learn more">
                  <p>
                    📈 Report: Prioritization scores are calculated using the
                    Marxan software package, where the score shows the frequency
                    of an area being selected in the prioritization. The range
                    of scores is from 0 to 10, with 0 being the least
                    prioritized and 10 being the most prioritized.
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

// Generate summary table with min, mean, max for each sketch
const genSketchSummary = (
  data: ReportResult,
  metricGroup: MetricGroup,
  childProperties: SketchProperties[],
  t: TFunction,
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];

  // Calculate stats for each sketch
  const sketchStats = childSketchIds.map((sketchId) => {
    const sketchMetrics = data.metrics.filter(
      (m) => m.metricId === metricGroup.metricId && m.sketchId === sketchId,
    );
    const stats = calculateMarxanStats(sketchMetrics);
    const sketchName =
      childProperties.find((sp) => sp.id === sketchId)?.name || sketchId;

    return {
      sketchId,
      sketchName,
      min: stats.min,
      max: stats.max,
      mean: stats.mean,
    };
  });

  return (
    <Table
      columns={[
        { Header: t("Sketch"), accessor: "sketchName" },
        { Header: t("Min"), accessor: "min" },
        { Header: t("Avg"), accessor: "mean" },
        { Header: t("Max"), accessor: "max" },
      ]}
      data={sketchStats.map((stat) => ({
        ...stat,
        mean: stat.mean.toFixed(2),
      }))}
    />
  );
};
