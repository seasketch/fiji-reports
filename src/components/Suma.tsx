import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  KeySection,
  LayerToggle,
  ReportError,
  ResultsCard,
  SketchClassTable,
  useSketchProperties,
  VerticalSpacer,
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
  percentWithEdge,
  roundDecimalFormat,
  roundLower,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Special Unique Marine Areas (SUMAs) report
 */
export const Suma: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("suma", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Special Unique Marine Areas (SUMAs)");
  const mapLabel = t("Show SUMAs On Map");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");
  const unitsLabel = t("ha");

  return (
    <ResultsCard title={titleLabel} functionName="suma" useChildCard>
      {(data: { totalValue: number; metrics: Metric[] }) => {
        const totalValue = data.totalValue;
        const totalSUMAs = 148263414428.76416; // From QGIS

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
                  filename="Suma"
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
                <Trans i18nKey="Suma 1">
                  This report summarizes the Special Unique Marine Areas (SUMAs)
                  contained within this plan.
                </Trans>
              </p>

              <LayerToggle layerId={metricGroup.layerId} label={mapLabel} />

              <VerticalSpacer />

              <KeySection>
                {t("This plan contains")}{" "}
                <b>
                  {roundLower(totalValue / 10000)} {unitsLabel}
                </b>
                {" of SUMAs, "}
                {t("which is")}{" "}
                <b>{percentWithEdge(totalValue / totalSUMAs)}</b>{" "}
                {t("of total SUMA area.")}
              </KeySection>

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: t("Name"),
                    type: "class",
                    width: 50,
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
                    width: 30,
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
                <Trans i18nKey="Suma - learn more">
                  <p>
                    ℹ️ Overview:{" "}
                    <a
                      href="https://macbio-pacific.info/Resources/biophysically-special-unique-marine-areas-of-fiji/"
                      target="_blank"
                    >
                      Biophysically Special, Unique Marine Areas of Fiji Report
                    </a>
                  </p>
                  <p>
                    📈 Report: This report calculates the total area of SUMAs
                    within the plan. This value is divided by the total area of
                    SUMAs to obtain the % contained within the plan. Overlap of
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
