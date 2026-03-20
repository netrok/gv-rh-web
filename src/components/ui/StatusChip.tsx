import Chip from "@mui/material/Chip";

type StatusTone = "success" | "warning" | "error" | "info" | "default";

type StatusChipProps = {
  label: string;
  tone?: StatusTone;
};

function normalizeLabel(value: string) {
  return value.trim().toUpperCase();
}

function resolveTone(label: string): StatusTone {
  const normalized = normalizeLabel(label);

  if (["ACTIVO", "APROBADA", "APROBADO", "CONFIRMADO"].includes(normalized)) {
    return "success";
  }

  if (["PENDIENTE", "EN PROCESO", "POR REVISAR"].includes(normalized)) {
    return "warning";
  }

  if (["INACTIVO", "RECHAZADA", "RECHAZADO", "CANCELADO", "ERROR"].includes(normalized)) {
    return "error";
  }

  if (["INFO", "REGISTRADO"].includes(normalized)) {
    return "info";
  }

  return "default";
}

export default function StatusChip({ label, tone }: StatusChipProps) {
  const finalTone = tone ?? resolveTone(label);

  return (
    <Chip
      label={normalizeLabel(label)}
      color={finalTone === "default" ? undefined : finalTone}
      variant={finalTone === "default" ? "outlined" : "filled"}
      size="small"
    />
  );
}