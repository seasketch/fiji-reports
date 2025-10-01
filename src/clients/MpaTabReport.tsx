import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
  useSketchProperties,
  Card,
} from "@seasketch/geoprocessing/client-ui";
import Translator from "../components/TranslatorAsync.js";
import { Size } from "../components/Size.js";
import { Gfw } from "../components/Gfw.js";
import { Ebsa } from "../components/Ebsa.js";
import { Geomorphology } from "../components/Geomorphology.js";
import { DeepwaterBioregions } from "../components/DeepwaterBioregions.js";
import { Suma } from "../components/Suma.js";
import { Depth } from "../components/Depth.js";
import { HydrothermalVents } from "../components/HydrothermalVents.js";
import { DistanceToPort } from "../components/DistanceToPort.js";
import { DistanceToShore } from "../components/DistanceToShore.js";
import { Sites } from "../components/Sites.js";
import { FishDensity } from "../components/FishDensity.js";
import { FishBiomass } from "../components/FishBiomass.js";
import { JuvenileCoralDensity } from "../components/JuvenileCoralDensity.js";
import { BenthicCover } from "../components/BenthicCover.js";
import { BenthicRichness } from "../components/BenthicRichness.js";
import { InvertPresence } from "../components/InvertPresence.js";
import { TaxaRichness } from "../components/TaxaRichness.js";
import { WaterQuality } from "../components/WaterQuality.js";
import { Dhw } from "../components/Dhw.js";
import { BleachingAlerts } from "../components/BleachingAlerts.js";
import { BenthicACA } from "../components/BenthicACA.js";
import { Marxan } from "../components/Marxan.js";
import { PristineSeas } from "../components/PristineSeas.js";
import { Mangroves } from "../components/Mangroves.js";
import { GeomorphACA } from "../components/GeomorphACA.js";
import { Printer } from "@styled-icons/bootstrap";
import { useReactToPrint } from "react-to-print";
import { SketchProperties } from "@seasketch/geoprocessing";

const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [
    { id: "VIABILITY", label: t("Viability") },
    { id: "EXPEDITION", label: t("Expedition") },
    { id: "REPRESENTATION", label: t("Representation") },
  ];
  const [tab, setTab] = useState<string>("VIABILITY");

  // Printing
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [attributes] = useSketchProperties();

  // Remove animations for printing
  const originalAnimationDurations: string[] = [
    ...document.querySelectorAll(".chart, .animated-scatter"),
  ].map((el) => (el as HTMLElement).style.animationDuration);
  useEffect(() => {
    if (isPrinting) {
      [...document.querySelectorAll(".chart, .animated-scatter")].forEach(
        (el) => ((el as HTMLElement).style.animationDuration = "0s"),
      );
      handlePrint();
    }

    return () => {
      [...document.querySelectorAll(".chart, .animated-scatter")].forEach(
        (el, index) =>
          ((el as HTMLElement).style.animationDuration =
            originalAnimationDurations[index]),
      );
    };
  }, [isPrinting]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: attributes.name,
    onBeforeGetContent: () => {},
    onAfterPrint: () => setIsPrinting(false),
  });

  return (
    <>
      {/* Print/Save to PDF button */}
      <Printer
        size={18}
        color="#999"
        title="Print/Save to PDF"
        style={{
          float: "right",
          margin: "5px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
        onClick={() => setIsPrinting(true)}
      />
      {/* Printing loading screen */}
      {isPrinting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card>Printing...</Card>
        </div>
      )}
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={segments}
        />
      </div>
      <div
        ref={printRef}
        style={{ backgroundColor: isPrinting ? "#FFF" : "inherit" }}
      >
        <style>{getPageMargins()}</style>
        {isPrinting && <SketchAttributes {...attributes} />}
        <ReportPage hidden={!isPrinting && tab !== "VIABILITY"}>
          <Size printing={isPrinting} />
          <DistanceToPort printing={isPrinting} />
          <DistanceToShore printing={isPrinting} />
          <Gfw printing={isPrinting} />
          <Marxan printing={isPrinting} />
          {!isPrinting && <SketchAttributesCard autoHide />}{" "}
        </ReportPage>
        <ReportPage hidden={!isPrinting && tab !== "EXPEDITION"}>
          <Sites printing={isPrinting} />
          <FishDensity printing={isPrinting} />
          <FishBiomass printing={isPrinting} />
          <JuvenileCoralDensity printing={isPrinting} />
          <BenthicCover printing={isPrinting} />
          <InvertPresence printing={isPrinting} />
          <TaxaRichness printing={isPrinting} />
          <WaterQuality printing={isPrinting} />
        </ReportPage>
        <ReportPage hidden={!isPrinting && tab !== "REPRESENTATION"}>
          <Depth printing={isPrinting} />
          <Ebsa printing={isPrinting} />
          <Suma printing={isPrinting} />
          <HydrothermalVents printing={isPrinting} />
          <Geomorphology printing={isPrinting} />
          <DeepwaterBioregions printing={isPrinting} />
          <BenthicRichness printing={isPrinting} />
          <Dhw printing={isPrinting} />
          <BleachingAlerts printing={isPrinting} />
          <BenthicACA printing={isPrinting} />
          <GeomorphACA printing={isPrinting} />
          <PristineSeas printing={isPrinting} />
          <Mangroves printing={isPrinting} />
        </ReportPage>
      </div>
    </>
  );
};

const getPageMargins = () => {
  return `@page { margin: .1mm !important; }`;
};

const SketchAttributes: React.FunctionComponent<SketchProperties> = (
  attributes,
) => {
  const { t } = useTranslation();
  return (
    <Card>
      <h1 style={{ fontWeight: "normal", color: "#777" }}>{attributes.name}</h1>
      <p>
        {t("Sketch ID")}: {attributes.id}
      </p>
      <p>
        {t("Sketch created")}: {new Date(attributes.createdAt).toLocaleString()}
      </p>
      <p>
        {t("Sketch last updated")}:{" "}
        {new Date(attributes.updatedAt).toLocaleString()}
      </p>
      <p>
        {t("Document created")}: {new Date().toLocaleString()}
      </p>
      <SketchAttributesCard />
    </Card>
  );
};

// Named export loaded by storybook
export const MpaTabReport = () => {
  return (
    <Translator>
      <BaseReport />
    </Translator>
  );
};

// Default export lazy-loaded by production ReportApp
export default MpaTabReport;
