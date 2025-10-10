import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  DataDownload,
  KeySection,
  LayerToggle,
  Pill,
  ReportError,
  ResultsCard,
  SketchClassTable,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  roundDecimal,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";
import { PristineSeasHistogram } from "./PristineSeasHistogram.js";
import type { PristineSeasReportResult } from "../functions/pristineSeas.js";

/**
 * Pristine Seas report
 */
export const PristineSeas: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();

  // Metrics
  const metricGroup = project.getMetricGroup("pristineSeas", t);

  // Labels
  const titleLabel = t("Pristine Seas Prioritization");
  const mapLabel = t("Map");
  const withinLabel = t("Average");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="pristineSeas" useChildCard>
        {(data: PristineSeasReportResult) => {
          const metrics = metricsWithSketchId(
            data.metrics.filter(
              (m) =>
                m.metricId === metricGroup.metricId && m.classId !== "multi",
            ),
            [id],
          );

          return (
            <ReportError>
              <ToolbarCard
                title={titleLabel}
                items={
                  <>
                    <LayerToggle
                      layerId={
                        metricGroup.classes.find((c) => c.classId === "multi")
                          ?.layerId
                      }
                      label={t("Show on Map")}
                      simple
                    />
                    <DataDownload
                      filename="PristineSeas"
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
                  <Trans i18nKey="PristineSeas 1">
                    This report summarizes this plan's overlap with Pristine
                    Seas prioritization framework, which informs areas of the
                    ocean suitable for biodiversity protection, food provision,
                    and carbon storage.
                  </Trans>
                </p>

                <p>
                  This area has an average triple-benefit score of{" "}
                  <Pill>
                    {data.metrics
                      .find((m) => m.classId === "multi" && m.sketchId === id)
                      ?.value.toFixed(2)}
                  </Pill>
                </p>

                {data.histogram && data.histogram.length > 0 && (
                  <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                    <PristineSeasHistogram
                      data={data.histogram}
                      average={
                        data.metrics.find(
                          (m) => m.classId === "multi" && m.sketchId === id,
                        )?.value
                      }
                    />
                  </div>
                )}

                <Collapse title={t("Show By Individual Benefit")}>
                  <ClassTable
                    rows={metrics}
                    metricGroup={{
                      ...metricGroup,
                      classes: metricGroup.classes.filter(
                        (c) => c.classId !== "multi",
                      ),
                    }}
                    columnConfig={[
                      {
                        columnLabel: t("Benefit"),
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
                </Collapse>

                {isCollection && childProperties && (
                  <Collapse
                    title={t("Show by Sketch")}
                    key={props.printing + "PristineSeas Sketch Collapse"}
                    collapsed={!props.printing}
                  >
                    {genSketchTable(data, metricGroup, childProperties)}
                  </Collapse>
                )}

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "PristineSeas Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="PristineSeas - learn more">
                    <p>
                      ℹ️ Overview: In the triple-benefit score, the three
                      benefits are weighted equally. Areas ranked between 0.95-1
                      correspond to the most important 5% of the ocean. Areas
                      ranked between 0.9-1, correspond to the most important 10%
                      of the ocean, and so on.
                    </p>
                    <p>
                      🗺️ Source Data: Sala, E., Mayorga, J., Bradley, D. et al.
                      Protecting the global ocean for biodiversity, food and
                      climate. Nature 592, 397-402 (2021).
                      https://doi.org/10.1038/s41586-021-03371-z.
                    </p>
                    <p>
                      📈 Report: This report calculates the average food,
                      biodiversity, and carbon rating within the plan.
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
    value: m.value === null ? -1 : roundDecimal(Number(m.value), 2),
  }));
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return <SketchClassTable rows={sketchRows} metricGroup={metricGroup} />;
};
