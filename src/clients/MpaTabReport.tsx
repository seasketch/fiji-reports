import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
} from "@seasketch/geoprocessing/client-ui";
import Translator from "../components/TranslatorAsync.js";
import { SizeCard } from "../components/SizeCard.js";
import { Gfw } from "../components/Gfw.js";
import { EbsaCard } from "../components/EbsaCard.js";
import { GeomorphologyCard } from "../components/GeomorphologyCard.js";
import { DeepwaterBioregionsCard } from "../components/DeepwaterBioregionsCard.js";
import { BenthicRichnessCard } from "../components/BenthicRichnessCard.js";
import { SumaCard } from "../components/SumaCard.js";
import { Depth } from "../components/Depth.js";
import { HydrothermalVents } from "../components/HydrothermalVents.js";
import { DistanceToPort } from "../components/DistanceToPort.js";
import { DistanceToShore } from "../components/DistanceToShore.js";
import { Sites } from "../components/Sites.js";
import { FishDensity } from "../components/FishDensity.js";
import { FishBiomass } from "../components/FishBiomass.js";

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
        <SizeCard />
        <DistanceToPort />
        <DistanceToShore />
        <Gfw />
        <SketchAttributesCard autoHide />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "EXPEDITION"}>
        <Sites />
        <FishDensity />
        <FishBiomass />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "REPRESENTATION"}>
        <Depth />
        <EbsaCard />
        <SumaCard />
        <HydrothermalVents />
        <GeomorphologyCard />
        <DeepwaterBioregionsCard />
        <BenthicRichnessCard />
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
