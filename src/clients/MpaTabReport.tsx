import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
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

const enableAllTabs = false;
const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [
    { id: "VIABILITY", label: t("Viability") },
    { id: "EXPEDITION", label: t("Expedition") },
    { id: "REPRESENTATION", label: t("Representation") },
  ];
  const [tab, setTab] = useState<string>("VIABILITY");

  return (
    <>
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={segments}
        />
      </div>
      <ReportPage hidden={!enableAllTabs && tab !== "VIABILITY"}>
        <Size />
        <DistanceToPort />
        <DistanceToShore />
        <Gfw />
        <SketchAttributesCard autoHide />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "EXPEDITION"}>
        <Sites />
        <FishDensity />
        <FishBiomass />
        <JuvenileCoralDensity />
        <BenthicCover />
        <InvertPresence />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "REPRESENTATION"}>
        <Depth />
        <Ebsa />
        <Suma />
        <HydrothermalVents />
        <Geomorphology />
        <DeepwaterBioregions />
        <BenthicRichness />
      </ReportPage>
    </>
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
