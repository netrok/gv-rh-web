import { api } from "./axios";

export type DocumentoVencimientoItem = {
  empleadoId: number;
  numEmpleado: string;
  empleadoNombreCompleto: string;
  tipoDocumento: string;
  fechaDocumento?: string | null;
  fechaVencimiento?: string | null;
  diasParaVencer: number;
  estaVencido: boolean;
  comentario?: string | null;
};

export type DocumentoVencimientoResumen = {
  fechaCorte: string;
  diasAnticipacion: number;
  totalPorVencer: number;
  totalVencidos: number;
  porVencer: DocumentoVencimientoItem[];
  vencidos: DocumentoVencimientoItem[];
};

export type NotificarDocumentosPorVencerRequest = {
  diasAnticipacion: number;
  incluirVencidos: boolean;
};

export type NotificarDocumentosPorVencerResponse = {
  ok: boolean;
  enviados: number;
  diasAnticipacion: number;
  incluirVencidos: boolean;
  mensaje: string;
};

export async function getExpedienteNotificacionesPreview(params?: {
  diasAnticipacion?: number;
  incluirVencidos?: boolean;
}) {
  const { data } = await api.get<DocumentoVencimientoResumen>(
    "/api/ExpedienteNotificaciones/preview",
    {
      params: {
        diasAnticipacion: params?.diasAnticipacion ?? 30,
        incluirVencidos: params?.incluirVencidos ?? true,
      },
    }
  );

  return data;
}

export async function postExpedienteNotificaciones(
  payload: NotificarDocumentosPorVencerRequest
) {
  const { data } = await api.post<NotificarDocumentosPorVencerResponse>(
    "/api/ExpedienteNotificaciones/notificar-vencimientos",
    payload
  );

  return data;
}