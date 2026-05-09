import masterCsv from "./data/nittoColorMaster.csv?raw";
import {
  createFivePrimariesExcelCsv,
  findColorByCodeInMaster,
  loadNittoColorMasterFromCsv,
  rgbToFivePrimaries,
} from "./nittoColorCore.js";

let activeMaster;

export function loadNittoColorMaster() {
  if (!activeMaster) {
    activeMaster = loadNittoColorMasterFromCsv(masterCsv);
  }
  return activeMaster;
}

export function findColorByCode(code, master = loadNittoColorMaster()) {
  return findColorByCodeInMaster(code, master);
}

export function exportFivePrimariesExcel(options = {}) {
  const csv = createFivePrimariesExcelCsv(loadNittoColorMaster());
  const filename = options.filename || "fivePrimaries.csv";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export { rgbToFivePrimaries };
