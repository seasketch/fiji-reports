import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  KeySection,
  ReportError,
  ReportTableStyled,
  ResultsCard,
  Table,
  useSketchProperties,
  VerticalSpacer,
} from "@seasketch/geoprocessing/client-ui";
import { Metric } from "@seasketch/geoprocessing/client-core";
import { styled } from "styled-components";

export const DistanceToShore: React.FunctionComponent<any> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const titleLabel = t("Distance To Shore");

  return (
    <ReportError>
      <ResultsCard title={titleLabel} functionName="distanceToShore">
        {(data: Metric[]) => {
          const minDist = Math.min(...data.map((d) => d.value));
          const maxDist = Math.max(...data.map((d) => d.value));

          return (
            <>
              {!isCollection ? (
                <KeySection>
                  This MPA is <b>{data[0].value.toFixed(1)} km</b> from shore.
                </KeySection>
              ) : (
                <KeySection
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  <span>
                    {t("Min")}: <b>{minDist.toFixed(1)} km</b>
                  </span>
                  <span>
                    {t("Max")}: <b>{maxDist.toFixed(1)} km</b>
                  </span>
                </KeySection>
              )}
              {isCollection && (
                <Collapse title="Show by MPA">
                  {genDistanceTable(data)}
                </Collapse>
              )}
              <Collapse title={t("Learn More")}>
                <Trans i18nKey="DistanceToShore Card - Learn more">
                  <p>
                    📈 Report: Calculates the minimum distance from each MPA to
                    shore.
                  </p>
                </Trans>
              </Collapse>
            </>
          );
        }}
      </ResultsCard>
    </ReportError>
  );
};

export const DistanceTableStyled = styled(ReportTableStyled)`
  width: 100%;
  overflow-x: auto;
  font-size: 12px;

  th:first-child,
  td:first-child {
    min-width: 140px;
    position: sticky;
    left: 0;
    text-align: left;
    background: #efefef;
  }

  th,
  td {
    text-align: center;
    white-space: nowrap;
  }
`;

export const genDistanceTable = (data: Metric[]) => (
  <DistanceTableStyled>
    <Table
      columns={[
        { Header: "MPA", accessor: "sketchName" },
        {
          Header: "Distance To Shore",
          accessor: "distance",
        },
      ]}
      data={data.map((d) => ({
        ...d,
        sketchName: d.extra?.sketchName,
        distance: d.value.toFixed(1) + " km",
      }))}
    />
  </DistanceTableStyled>
);
