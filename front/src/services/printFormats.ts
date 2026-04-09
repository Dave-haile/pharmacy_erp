import {
  CreatePrintFormatPayload,
  PrintDocumentType,
  PrintFormat,
  PrintFormatListResponse,
} from "../types/types";
import api from "./api";

export const fetchPrintFormats = async (documentType: PrintDocumentType) => {
  const params = new URLSearchParams({
    document_type: documentType,
    is_active: "true",
  });
  const res = await api.get(`/api/inventory/print-formats/?${params.toString()}`);
  return res.data as PrintFormatListResponse;
};

export const createPrintFormat = async (payload: CreatePrintFormatPayload) => {
  const res = await api.post("/api/inventory/print-formats/create/", payload);
  return res.data as {
    message?: string;
    print_format: PrintFormat;
  };
};

export const updatePrintFormat = async (
  printFormatId: number,
  payload: CreatePrintFormatPayload,
) => {
  const res = await api.put(
    `/api/inventory/print-formats/${printFormatId}/update/`,
    payload,
  );
  return res.data as {
    message?: string;
    print_format: PrintFormat;
  };
};

export const deletePrintFormat = async (printFormatId: number) => {
  const res = await api.delete(
    `/api/inventory/print-formats/${printFormatId}/delete/`,
  );
  return res.data as {
    message?: string;
  };
};
