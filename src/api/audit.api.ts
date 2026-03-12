import { api } from "./axios";

export type AuditItem = {
  id: number;
  occurredAtUtc: string;
  action: string;
  entityName: string;
  recordId: string;
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditDetail = {
  id: number;
  occurredAtUtc: string;
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entityName: string;
  recordId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldValuesJson?: string | null;
  newValuesJson?: string | null;
  changedColumnsJson?: string | null;
};

export type AuditListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: AuditItem[];
};

export type AuditQueryParams = {
  entityName?: string;
  recordId?: string;
  action?: string;
  email?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function getAudit(params: AuditQueryParams) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  );

  const { data } = await api.get<AuditListResponse>("/api/audit", {
    params: cleanParams,
  });

  return data;
}

export async function getAuditById(id: number, pretty = true) {
  const { data } = await api.get<AuditDetail>(`/api/audit/${id}`, {
    params: { pretty },
  });

  return data;
}

export async function downloadAuditXlsx(params: AuditQueryParams) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  );

  const response = await api.get("/api/audit/export.xlsx", {
    params: cleanParams,
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  const disposition = response.headers["content-disposition"] as string | undefined;

  let fileName = "audit.xlsx";
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  if (match?.[1]) fileName = match[1];

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}