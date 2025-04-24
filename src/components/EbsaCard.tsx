import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  LayerToggle,
  ReportError,
  ResultsCard,
  SketchClassTable,
  useSketchProperties,
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
  squareMeterToKilometer,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/**
 * Ecologically and Biologically Significant Areas (EBSAs) report
 */
export const EbsaCard: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("ebsa", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t(
    "Ecologically and Biologically Significant Areas (EBSAs)",
  );
  const mapLabel = t("Show EBSAs On Map");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");
  const unitsLabel = t("km²");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="ebsa"
      extraParams={{ geographyIds: [curGeography.geographyId] }}
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

        const objectives = (() => {
          const objectives = project.getMetricGroupObjectives(metricGroup, t);
          if (objectives.length) {
            return objectives;
          } else {
            return;
          }
        })();

        return (
          <ReportError>
            <p>
              <Trans i18nKey="EbsaCard 1">
                Ecologically or Biologically Significant Marine Areas (EBSAs)
                are areas of the ocean that have special importance in terms of
                ecological and/or biological characteristics, for example, as
                essential habitats, food sources or breeding grounds for
                particular species.
              </Trans>
            </p>

            <LayerToggle layerId={metricGroup.layerId} label={mapLabel} />

            <ClassTable
              rows={metrics}
              metricGroup={metricGroup}
              objective={objectives}
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
                    roundDecimalFormat(squareMeterToKilometer(Number(val))),
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
              <Trans i18nKey="EbsaCard - learn more">
                <p>
                  ℹ️ Overview: The EBSA criteria are (1) uniqueness or rarity,
                  (2) special importance for life history stages of species, (3)
                  importance for threatened, endangered or declining species
                  and/or habitats, (4) vulnerability, fragility, sensitivity, or
                  slow recovery, (5) biological productivity, (6) biological
                  diversity, and (7) naturalness. These areas can include seabed
                  habitats from the coastline to deep ocean trenches, and can be
                  located at a variety of depths in the water column from the
                  surface to the abyss.
                </p>
                <p>
                  🗺️ See More:{" "}
                  <a
                    href="https://www.cbd.int/marine/ebsa/booklet-01-wsp-en.pdf"
                    target="_blank"
                  >
                    Ecologically or Biologically Significant Marine Areas:
                    Western South Pacific
                  </a>
                </p>
                <p>
                  📈 Report: This report calculates the total area of each EBSA
                  within the plan. This total is divided by the total area of
                  each EBSA to obtain the % contained within the plan. Overlap
                  of sketches is not handled, and overlapping areas will be
                  double counted if drawn. Reach out to the developers if sketch
                  overlap needs to be accounted for.
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
