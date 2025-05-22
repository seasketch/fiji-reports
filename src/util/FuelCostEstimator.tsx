import React, { useMemo, useState } from "react";
import { styled } from "styled-components";
import { VerticalSpacer } from "@seasketch/geoprocessing/client-ui";

const FuelCostForm = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  justify-content: space-around;
`;

const FormField = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #444;
`;

const FieldLabel = styled.div`
  text-align: center;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const UnitDisplay = styled.div`
  display: flex;
  align-items: end;
`;

const BaseInput = styled.input.attrs({ type: "number" })`
  padding: 0.35rem 0.6rem;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  border-radius: 6px;
  border: 1px solid #d2d7dd;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  background: #fff;
  width: 4rem;

  &:focus {
    outline: none;
    border-color: #1c90ff;
    box-shadow: 0 0 0 2px rgba(28, 144, 255, 0.3);
  }
`;

const NumberInput = BaseInput;
const UnitSelect = styled(BaseInput).attrs({ as: "select", type: undefined })``;

interface FuelCostEstimatorProps {
  distanceKm: number;
}

type EfficiencyUnit = "km/L" | "L/km" | "L/nm" | "nm/L";

const NM_TO_KM = 1.852; // 1 nautical mile = 1.852 kilometers

export const FuelCostEstimator: React.FC<FuelCostEstimatorProps> = ({
  distanceKm,
}) => {
  const [efficiencyValue, setEfficiencyValue] = useState<number>(1.5);
  const [efficiencyUnit, setEfficiencyUnit] = useState<EfficiencyUnit>("km/L");
  const [pricePerLitre, setPricePerLitre] = useState<number>(2.31);

  // Convert efficiency to km/L
  const kmPerLitre = useMemo(() => {
    switch (efficiencyUnit) {
      case "km/L":
        return efficiencyValue;
      case "L/km":
        return 1 / efficiencyValue;
      case "L/nm":
        return NM_TO_KM / efficiencyValue;
      case "nm/L":
        return efficiencyValue * NM_TO_KM;
      default:
        return efficiencyValue;
    }
  }, [efficiencyValue, efficiencyUnit]);

  const cost = useMemo(
    () => (kmPerLitre <= 0 ? NaN : (distanceKm / kmPerLitre) * pricePerLitre),
    [distanceKm, kmPerLitre, pricePerLitre],
  );

  return (
    <>
      <FuelCostForm>
        <FormField>
          <FieldLabel>Fuel Efficiency</FieldLabel>
          <InputContainer>
            <NumberInput
              step="0.1"
              min="0"
              value={efficiencyValue}
              onChange={(e) =>
                setEfficiencyValue(parseFloat(e.target.value) || 0)
              }
            />
            <UnitSelect
              value={efficiencyUnit}
              onChange={(e) =>
                setEfficiencyUnit(e.target.value as EfficiencyUnit)
              }
            >
              <option value="km/L">km/L</option>
              <option value="L/km">L/km</option>
              <option value="L/nm">L/nm</option>
              <option value="nm/L">nm/L</option>
            </UnitSelect>
          </InputContainer>
        </FormField>

        <FormField>
          <FieldLabel>Fuel Price</FieldLabel>
          <InputContainer>
            <NumberInput
              step="0.01"
              min="0"
              value={pricePerLitre}
              onChange={(e) =>
                setPricePerLitre(parseFloat(e.target.value) || 0)
              }
            />
            <UnitDisplay>$FJD/L</UnitDisplay>
          </InputContainer>
        </FormField>
      </FuelCostForm>
      <VerticalSpacer />

      {!isNaN(cost) && (
        <>
          Cost of travel may be near <b>${cost.toFixed(0)} FJD</b> one-way, and{" "}
          <b>${(cost * 2).toFixed(0)} FJD</b> round-trip.
        </>
      )}
    </>
  );
};
