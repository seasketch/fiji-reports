import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
} from "@seasketch/geoprocessing/client-ui";
import Translator from "../components/TranslatorAsync.js";
import { SizeCard } from "../components/SizeCard.js";
import { GfwCard } from "../components/GfwCard.js";
import { BiodiversityCard } from "../components/BiodiversityCard.js";
import { GeomorphologyCard } from "../components/GeomorphologyCard.js";
import { DeepwaterBioregionsCard } from "../components/DeepwaterBioregionsCard.js";

const enableAllTabs = false;
const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [
    { id: "VIABILITY", label: t("Viability") },
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
        <GfwCard />
        <SketchAttributesCard autoHide />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "REPRESENTATION"}>
        <BiodiversityCard />
        <GeomorphologyCard />
        <DeepwaterBioregionsCard />
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
