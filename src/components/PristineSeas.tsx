import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  ReportError,
  ResultsCard,
  SketchClassTable,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  roundDecimal,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * PristineSeas component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const PristineSeas: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("pristineSeas", t);

  // Labels
  const titleLabel = t("Pristine Seas");
  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="pristineSeas"
      extraParams={{ geographyIds: [curGeography.geographyId] }}
    >
      {(data: ReportResult) => {
        const metrics = metricsWithSketchId(
          data.metrics.filter((m) => m.metricId === metricGroup.metricId),
          [id],
        );

        return (
          <ReportError>
            <p>
              <Trans i18nKey="PristineSeas 1">
                This report summarizes this plan's overlap with Pristine Seas
                prioritization framework, which informs areas of the ocean
                suitable for biodiversity protection, food provision and carbon
                storage.
              </Trans>
            </p>

            <ClassTable
              rows={metrics}
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
                  valueFormatter: (val) => {
                    const num = Number(val);
                    return isNaN(num) ? "N/A" : num.toFixed(2);
                  },
                  chartOptions: {
                    showTitle: true,
                  },
                  width: 20,
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
                {genSketchTable(data, metricGroup, childProperties)}
              </Collapse>
            )}

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="PristineSeas - learn more">
                <p>
                  🗺️ Source Data: Juan Mayorga, Pristine Seas Sala, E., Mayorga,
                  J., Bradley, D. et al. Protecting the global ocean for
                  biodiversity, food and climate. Nature 592, 397-402 (2021).
                  https://doi.org/10.1038/s41586-021-03371-z Uploaded 10/9/2024
                </p>
                <p>
                  📈 Report: This report calculates the average food,
                  biodiversity, and carbon rating within the plan.
                </p>
              </Trans>
            </Collapse>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  childProperties: SketchProperties[],
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketchMetrics = metricsWithSketchId(
    data.metrics.filter((m) => m.metricId === metricGroup.metricId),
    childSketchIds,
  ).map((m) => ({
    ...m,
    value: m.value === null ? null : roundDecimal(Number(m.value), 2),
  }));
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return <SketchClassTable rows={sketchRows} metricGroup={metricGroup} />;
};
