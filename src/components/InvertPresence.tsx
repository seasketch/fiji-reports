import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  ReportError,
  ResultsCard,
  SketchClassTableStyled,
  Table,
  useSketchProperties,
  ToolbarCard,
  DataDownload,
  Skeleton,
} from "@seasketch/geoprocessing/client-ui";
import { MetricGroup } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";
import { CheckCircleFill } from "@styled-icons/bootstrap/CheckCircleFill";
import { XCircleFill } from "@styled-icons/bootstrap/XCircleFill";

interface Pt {
  id: string;
  [key: string]: string | number;
}

const invertPresenceGroups = {
  Bivalves: [
    "Tridacna sp",
    "Tridacna mbalavuana",
    "Tridacna crocea",
    "Tridacna squamosa",
    "Tridacna maxima",
    "Tridacna gigas",
    "Tridacna derasa",
  ],
  Cephalopods: ["Octopus sp", "Octopus cyanea"],
  Crustaceans: ["Panulirus versicolor"],
  Gastropods: ["Turbo marmoratus", "Charonia tritonis", "Rochia nilotica"],
  "Sea Cucumbers": [
    "Thelenota anax",
    "Thelenota ananas",
    "Stichopus vastus",
    "Stichopus hermannii",
    "Stichopus chloronatus",
    "Holothuria whitmaei",
    "Holothuria nobilis",
    "Holothuria fuscogilva",
    "Holothuria edulis",
    "Holothuria atra",
    "Bohadschia vitiensis",
    "Actinopyga palauensis",
    "Actinopyga miliaris",
    "Actinopyga mauritiana",
    "Actinopyga lecanora",
    "Actinopyga echinites",
    "Pearsonothuria graeffei",
    "Holothuria fuscopunctata",
    "Bohadschia argus",
    "Actinopyga echinoidea",
    "Holothuria scabra",
    "Pearsonothuria scabra",
    "Stichopus fuscus",
  ],
  "Sea Stars": ["Culcita novaeguineae", "Acanthaster planci"],
  Urchins: [
    "Echinostrephus aciculatus",
    "Echinometra mathaei",
    "Diadema setosum",
  ],
};

/**
 * Invertebrate Presence report
 */
export const InvertPresence: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();

  const metricGroup = project.getMetricGroup("invertPresence", t);
  const classIds = metricGroup.classes.map((c: any) => c.classId);
  const titleLabel = t("Invertebrate Presence");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="invertPresence"
        useChildCard
      >
        {(invertPt: Pt[]) => {
          if (!invertPt || !Array.isArray(invertPt)) return <Skeleton />;
          const overall = invertPt.find((row) => row.id === "total");
          if (!overall) return null;

          return (
            <ReportError>
              <ToolbarCard
                title={titleLabel}
                items={
                  <DataDownload
                    filename="InvertPresence"
                    data={invertPt}
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
                  {invertPt.some(
                    (row) =>
                      typeof row.id === "string" &&
                      row.id.startsWith("province:"),
                  ) ? (
                    <Trans i18nKey="InvertPresence 1">
                      This report summarizes the presence of invertebrates
                      within the plan.
                    </Trans>
                  ) : (
                    <p
                      style={{
                        color: "#888",
                        fontStyle: "italic",
                        margin: "20px 0",
                      }}
                    >
                      No presence data falls within the plan.
                    </p>
                  )}
                </p>

                {Object.entries(invertPresenceGroups).map(
                  ([groupName, speciesList]) => (
                    <Collapse key={groupName} title={t(groupName)}>
                      <ClassTable
                        rows={classIds
                          .filter((id) => speciesList.includes(id))
                          .map((classId) => ({
                            classId,
                            value: overall[classId] === "true" ? 1 : 0,
                            metricId: metricGroup.metricId,
                            geographyId: null,
                            sketchId: null,
                            groupId: null,
                          }))}
                        metricGroup={metricGroup}
                        columnConfig={[
                          {
                            columnLabel: "Species",
                            type: "class",
                            colStyle: { fontStyle: "italic" },
                            width: 50,
                          },
                          {
                            columnLabel: "Present",
                            type: "metricValue",
                            metricId: metricGroup.metricId,
                            valueFormatter: (val) => (val === 1 ? "✓" : " "),
                            chartOptions: {
                              showTitle: true,
                            },
                            valueLabel: "",
                            colStyle: { textAlign: "center" },
                            width: 30,
                          },
                          {
                            columnLabel: "Map",
                            type: "layerToggle",
                            width: 20,
                          },
                        ]}
                      />
                    </Collapse>
                  ),
                )}

                <Collapse
                  title={t("Show by Province")}
                  key={props.printing + "InvertPresence Province Collapse"}
                  collapsed={!props.printing}
                >
                  {genSketchTable(
                    invertPt.filter(
                      (s) => s.id && s.id.startsWith("province:"),
                    ),
                    metricGroup,
                    t,
                  )}
                </Collapse>

                {isCollection && (
                  <Collapse
                    title={t("Show by Sketch")}
                    key={props.printing + "InvertPresence Sketch Collapse"}
                    collapsed={!props.printing}
                  >
                    {genSketchTable(
                      invertPt.filter(
                        (s) => s.id && s.id.startsWith("sketch:"),
                      ),
                      metricGroup,
                      t,
                    )}
                  </Collapse>
                )}

                <Collapse
                  title={t("Learn More")}
                  key={props.printing + "InvertPresence Learn More Collapse"}
                  collapsed={!props.printing}
                >
                  <Trans i18nKey="InvertPresence - learn more">
                    <p>
                      ℹ️ Overview: Invertebrate Presence, by site, from the Fiji
                      expedition.
                    </p>
                    <p>🗺️ Source Data: Fiji Expedition</p>
                    <p>
                      📈 Report: This report shows the presence of
                      macroinvertebrate species within the plan.
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

const genSketchTable = (data: Pt[], metricGroup: MetricGroup, t: any) => {
  const stations = data.filter((s) => s.id !== "total");

  const classColumns: Column<Record<string, string | number>>[] =
    metricGroup.classes.map((curClass) => ({
      Header: curClass.display,
      accessor: (row) => {
        const value = row[curClass.classId];
        return value === "true" ? (
          <CheckCircleFill
            size={15}
            style={{ color: "#78c679", paddingRight: 5 }}
          />
        ) : (
          <XCircleFill
            size={15}
            style={{ color: "#d73a49", paddingRight: 5 }}
          />
        );
      },
      style: { textAlign: "center" },
    }));

  const columns: Column<Record<string, string | number>>[] = [
    {
      Header: "ID",
      accessor: (row) => {
        const id =
          typeof row.id === "string"
            ? row.id.replace(/^sketch:|^province:/, "")
            : row.id;
        return <>{id}</>;
      },
    },
    ...(classColumns as Column<any>[]),
  ];

  return (
    <SketchClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={stations.sort((a, b) =>
          (a.id as string).localeCompare(b.id as string),
        )}
      />
    </SketchClassTableStyled>
  );
};
