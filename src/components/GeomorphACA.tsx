import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  DataDownload,
  LayerToggle,
  ReportError,
  ResultsCard,
  SketchClassTable,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  roundDecimalFormat,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";
import precalcMetrics from "../../data/precalc/precalcGeomorphACA.json" with { type: "json" };

/**
 * Allen Coral Atlas, Geomorphic Map report
 */
export const GeomorphACA: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("geomorphACA", t);

  // Labels
  const titleLabel = t("Geomorphic Features - Allen Coral Atlas");
  const withinLabel = t("Within Area");
  const percWithinLabel = t("% Within Area");
  const unitsLabel = t("ha");

  return (
    <ResultsCard title={titleLabel} functionName="geomorphACA" useChildCard>
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
                <>
                  <DataDownload
                    filename="GeomorphACA"
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
                <Trans i18nKey="GeomorphACA 1">
                  This report summarizes geomorphic features within the area of
                  interest, based on Allen Coral Atlas data.
                </Trans>
              </p>

              <LayerToggle
                layerId={metricGroup.layerId}
                label={t("Show Geomorphic Features On Map")}
              />

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: t("Geomorphic Feature"),
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
                <Trans i18nKey="GeomorphACA - learn more">
                  <p>
                    ℹ️ Overview: The Allen Coral Atlas is a global-scale coral
                    reef habitat mapping project that uses Planet Dove 3.7 m
                    resolution daily satellite imagery (in combination with wave
                    models and ecological data) to create consistent and high-
                    detail global habitat maps to support reef-related science
                    and conservation. The twelve Global Geomorphic Zones mapped
                    by the Allen Coral Atlas, in logical order from external
                    seaward-facing through to internal coral reef structural
                    features, are: Reef Slope, Sheltered Slope, Reed Crest,
                    Outer Reef Flat, Inner Reef Flat, Terrestrial Reef Flat,
                    Back Reef Slope, Deep Lagoon, Shallow Lagoon, Plateau, Patch
                    Reef, and Small Reef.
                  </p>
                  <p>
                    📈 Report: This report calculates the total area of each
                    geomorphic feature within the area of interest. This value
                    is divided by the total area of each geomorphic feature to
                    obtain the % contained within the area of interest.
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
