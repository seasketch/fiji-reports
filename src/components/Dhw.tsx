import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  ReportError,
  ResultsCard,
} from "@seasketch/geoprocessing/client-ui";
import { DHWResults } from "../functions/dhw.js";
import { DhwLineChart } from "./DhwLineChart.js";

/**
 * Dhw component
 */
export const Dhw: React.FunctionComponent<{ printing: boolean }> = (props) => {
  const { t } = useTranslation();

  // Labels
  const titleLabel = t("Degree Heating Weeks - NOAA Coral Reef Watch");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleLabel} functionName="dhw">
        {(data: DHWResults[]) => {
          // Check if we have any valid data points
          const hasValidData = data.some(
            (d) => d.min !== null || d.mean !== null || d.max !== null,
          );

          return (
            <ReportError>
              <p>
                <Trans i18nKey="Dhw 1">
                  This report summarizes the minimum, average, and maximum
                  Degree Heating Weeks (DHW, accumulated heat stress) in the
                  area of interest from 2015-2024, based on data from NOAA Coral
                  Reef Watch.
                </Trans>
              </p>

              {hasValidData ? (
                <DhwLineChart data={data} />
              ) : (
                <p
                  style={{
                    color: "#888",
                    fontStyle: "italic",
                    margin: "20px 0",
                  }}
                >
                  No coral reef data in area of interest
                </p>
              )}

              <Collapse
                title={t("Learn More")}
                key={props.printing + "Dhw Learn More Collapse"}
                collapsed={!props.printing}
              >
                <Trans i18nKey="Dhw - learn more">
                  <p>
                    ℹ️ Overview: The NOAA Coral Reef Watch (CRW) coral bleaching
                    Degree Heating Week (DHW) product shows accumulated heat
                    stress, which can lead to coral bleaching and death.
                  </p>
                  <p>
                    There is a risk of coral bleaching when the DHW value
                    reaches 4 °C-weeks. By the time the DHW value reaches 8
                    °C-weeks, reef-wide coral bleaching with mortality of
                    heat-sensitive corals is likely. If the accumulated heat
                    stress continues to build further and exceeds a DHW value of
                    12 °C-weeks, multi-species mortality becomes likely. At a
                    DHW greater than or equal to 16 °C-weeks, there is a risk of
                    severe, multi-species mortality (in over 50% of corals), and
                    at a DHW greater than or equal to 20 °C-weeks, near complete
                    mortality (in over 80% of corals) is likely.
                  </p>
                  <p>
                    📈 Report: This report calculates the total value of each
                    feature within the area of interest. This value is divided
                    by the total value of each feature to obtain the % contained
                    within the area of interest.
                  </p>
                </Trans>
              </Collapse>
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
  );
};
