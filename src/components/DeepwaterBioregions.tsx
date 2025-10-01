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

/**
 * Deepwater Bioregions report
 */
export const DeepwaterBioregions: React.FunctionComponent<{
  printing: boolean;
  geographyId?: string;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("deepwaterBioregions", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Deepwater Bioregions");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");
  const unitsLabel = t("ha");
  const mapLabel = t("Show on Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="deepwaterBioregions"
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
                  <>
                    <LayerToggle
                      layerId={metricGroup.layerId}
                      label={mapLabel}
                      simple
                    />
                    <DataDownload
                      filename="DeepwaterBioregions"
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
                  <Trans i18nKey="DeepwaterBioregions 1">
                    This report summarizes this plan's overlap with Fiji's
                    deepwater bioregions.
                  </Trans>
                </p>

                <ClassTable
                  rows={metrics.sort((a, b) => b.value - a.value)}
                  metricGroup={metricGroup}
                  columnConfig={[
                    {
                      columnLabel: titleLabel,
                      type: "class",
                      width: 55,
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
                  <Collapse
                    title={t("Show by Sketch")}
                    key={props.printing + "DeepwaterBioregions Sketch Collapse"}
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
                  key={
                    props.printing + "DeepwaterBioregions Learn More Collapse"
                  }
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="DeepwaterBioregions - learn more">
                    <p>
                      ℹ️ Overview: Thirty, mainly physical, environmental
                      variables were assessed to be adequately comprehensive and
                      reliable to be included in the analysis. These data were
                      allocated to over 140,000 grid cells of 20x20 km across
                      the Southwest Pacific. K-means and then hierarchical
                      cluster analyses were then conducted to identify groups of
                      analytical units that contained similar environmental
                      conditions. The number of clusters was determined by
                      examining the dendrogram and setting a similarity value
                      that aligned with a natural break in similarity.
                    </p>
                    <p>
                      See the report{" "}
                      <a
                        href="http://macbio-pacific.info/wp-content/uploads/2018/03/MACBIO-Bioregions-Report_Digital.pdf"
                        target="_blank"
                      >
                        here
                      </a>
                      .
                    </p>
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
                      deepwater bioregion within the plan. This value is divided
                      by the total area of each deepwater bioregion to obtain
                      the % contained within the plan. Overlap of sketches is
                      not handled, and overlapping areas will be double counted
                      if drawn. Reach out to the developers if sketch overlap
                      needs to be accounted for.
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
