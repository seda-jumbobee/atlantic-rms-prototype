import type { ContainerSpec, ContainerCode } from "@/lib/types";

// Sea-container specs transcribed from the RMS Data Room container-spec chart
// (ONE Glossary). Weights kg, dims m, capacity m³.
export const CONTAINERS: ContainerSpec[] = [
  { code: "20DC", label: "20' Dry Cargo", oneCode: "D2", grossKg: 24000, tareKg: 2370, payloadKg: 21630, intLengthM: 5.898, intWidthM: 2.352, intHeightM: 2.394, capacityCbm: 33.2 },
  { code: "40DC", label: "40' Dry Cargo", oneCode: "D4", grossKg: 30480, tareKg: 4000, payloadKg: 26480, intLengthM: 12.031, intWidthM: 2.352, intHeightM: 2.394, capacityCbm: 67.74 },
  { code: "40HC", label: "40' High Cube", oneCode: "D5", grossKg: 30480, tareKg: 3980, payloadKg: 26500, intLengthM: 12.031, intWidthM: 2.352, intHeightM: 2.698, capacityCbm: 76.3 },
  { code: "45HC", label: "45' High Cube", oneCode: "D7", grossKg: 30480, tareKg: 4800, payloadKg: 25680, intLengthM: 13.544, intWidthM: 2.352, intHeightM: 2.698, capacityCbm: 86.0 },
  { code: "20FR", label: "20' Flat Rack", oneCode: "F2", grossKg: 30480, tareKg: 2900, payloadKg: 27580, intLengthM: 5.624, intWidthM: 2.236, intHeightM: 2.234, capacityCbm: 27.9 },
  { code: "40FR", label: "40' Flat Rack", oneCode: "F4", grossKg: 30480, tareKg: 5870, payloadKg: 28130, intLengthM: 11.788, intWidthM: 2.236, intHeightM: 1.968, capacityCbm: 51.9 },
  { code: "20OT", label: "20' Open Top", oneCode: "O2", grossKg: 24000, tareKg: 2580, payloadKg: 21420, intLengthM: 5.629, intWidthM: 2.212, intHeightM: 2.311, capacityCbm: 32.0 },
  { code: "40OT", label: "40' Open Top", oneCode: "O4", grossKg: 30480, tareKg: 4290, payloadKg: 26190, intLengthM: 11.763, intWidthM: 2.212, intHeightM: 2.311, capacityCbm: 65.0 },
  { code: "20RF", label: "20' Reefer", oneCode: "R2", grossKg: 24000, tareKg: 3050, payloadKg: 20950, intLengthM: 5.449, intWidthM: 2.29, intHeightM: 2.244, capacityCbm: 26.7 },
  { code: "40RF", label: "40' Reefer HC", oneCode: "R5", grossKg: 30480, tareKg: 4520, payloadKg: 25960, intLengthM: 11.69, intWidthM: 2.25, intHeightM: 2.247, capacityCbm: 57.1 },
];

export const CONTAINER_LABEL: Record<ContainerCode, string> = {
  "20DC": "20' Dry Cargo",
  "40DC": "40' Dry Cargo",
  "40HC": "40' High Cube",
  "45HC": "45' High Cube",
  "20FR": "20' Flat Rack",
  "40FR": "40' Flat Rack",
  "20OT": "20' Open Top",
  "40OT": "40' Open Top",
  "20RF": "20' Reefer",
  "40RF": "40' Reefer HC",
  RORO: "RoRo (mafi / break-bulk)",
};

export function getContainer(code: ContainerCode): ContainerSpec | undefined {
  return CONTAINERS.find((c) => c.code === code);
}
