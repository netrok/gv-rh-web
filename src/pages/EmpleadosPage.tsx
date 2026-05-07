import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import {
  cambiarNumeroEmpleado,
  createAccountForEmpleado,
  createEmpleado,
  darBajaEmpleado,
  deleteEmpleadoPhoto,
  exportEmpleadoFichaPdf,
  exportEmpleadosPdf,
  exportEmpleadosXlsx,
  getEmpleados,
  getSiguienteNumeroEmpleadoSugerido,
  linkUserByEmail,
  reingresarEmpleado,
  resolveEmpleadoPhotoUrl,
  updateEmpleado,
  uploadEmpleadoPhoto,
  type DarBajaEmpleadoInput,
  type Empleado,
  type EmpleadoCreateInput,
  type EmpleadoImportExecuteResult,
  type ReingresarEmpleadoInput,
  type SexoEmpleado,
  type EstadoCivilEmpleado,
} from "../api/empleados.api";
import {
  getDepartamentos,
  type Departamento,
} from "../api/departamentos.api";
import { getPuestos, type Puesto } from "../api/puestos.api";
import { getSucursales, type SucursalDto } from "../api/sucursales.api";
import AppPage from "../components/ui/AppPage";
import EmptyState from "../components/ui/EmptyState";
import HeroBanner from "../components/ui/HeroBanner";
import MetricCard from "../components/ui/MetricCard";
import SectionCard from "../components/ui/SectionCard";
import EmpleadoImportDialog from "../components/empleados/EmpleadoImportDialog";
import { useAppSnackbar } from "../features/ui/AppSnackbarContext";
import { useAuth } from "../features/auth/AuthContext";

type SaveEmpleadoInput = EmpleadoCreateInput;

type TipoBajaEmpleado =
  | "VOLUNTARIA"
  | "INVOLUNTARIA"
  | "TERMINO_CONTRATO"
  | "ABANDONO"
  | "JUBILACION"
  | "DEFUNCION"
  | "OTRA";

type EstadoFiltroEmpleado = "" | "ACTIVO" | "BAJA";

type EmpleadoSortField =
  | "numEmpleado"
  | "nombre"
  | "puesto"
  | "sucursal"
  | "estatus";

type EmpleadoSortDirection = "asc" | "desc";

type AppUserRole = "ADMIN" | "RRHH" | "JEFE" | "CONSULTA" | "EMPLEADO";

type EmpleadoCuentaInfo = Empleado & {
  tieneCuenta?: boolean | null;
  usuarioId?: number | null;
  usuarioEmail?: string | null;
  usuarioRole?: string | null;
};

const ACCOUNT_ROLE_OPTIONS: Array<{ value: AppUserRole; label: string }> = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "RRHH", label: "RRHH" },
  { value: "JEFE", label: "JEFE" },
  { value: "CONSULTA", label: "CONSULTA" },
  { value: "EMPLEADO", label: "EMPLEADO" },
];

const EMPLEADO_FORM_STEPS = [
  "Generales",
  "Identificación",
  "Domicilio",
  "Emergencia",
] as const;

const SEXO_OPTIONS: { value: SexoEmpleado; label: string }[] = [
  { value: "NoEspecificado", label: "No especificado" },
  { value: "Hombre", label: "Hombre" },
  { value: "Mujer", label: "Mujer" },
  { value: "Otro", label: "Otro" },
];

const ESTADO_CIVIL_OPTIONS: { value: EstadoCivilEmpleado; label: string }[] = [
  { value: "NoEspecificado", label: "No especificado" },
  { value: "Soltero", label: "Soltero" },
  { value: "Casado", label: "Casado" },
  { value: "Divorciado", label: "Divorciado" },
  { value: "Viudo", label: "Viudo" },
  { value: "UnionLibre", label: "Unión libre" },
];

const empleadoSchema = z.object({
  numEmpleado: z.string().trim().max(30, "Máximo 30 caracteres"),

  nombres: z
    .string()
    .trim()
    .min(1, "Los nombres son obligatorios")
    .max(120, "Máximo 120 caracteres"),

  apellidoPaterno: z
    .string()
    .trim()
    .min(1, "El apellido paterno es obligatorio")
    .max(120, "Máximo 120 caracteres"),

  apellidoMaterno: z.string().trim().max(120, "Máximo 120 caracteres"),
  fechaNacimiento: z.string(),

  telefono: z
    .string()
    .trim()
    .max(15, "Máximo 15 caracteres")
    .refine((value) => value === "" || /^\d{10,15}$/.test(value), {
      message: "El teléfono debe contener entre 10 y 15 dígitos",
    }),

  email: z.union([z.literal(""), z.string().email("Correo inválido")]),

  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria"),
  activo: z.boolean(),
  departamentoId: z.coerce.number().min(1, "Debes seleccionar un departamento"),
  puestoId: z.coerce.number().min(1, "Debes seleccionar un puesto"),
  sucursalId: z.coerce.number().min(0),

  aprobadorPrimarioEmpleadoId: z.coerce.number().min(0),
  aprobadorSecundarioEmpleadoId: z.coerce.number().min(0),

  curp: z
    .string()
    .trim()
    .max(18, "Máximo 18 caracteres")
    .refine(
      (value) =>
        value === "" ||
        /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(value.toUpperCase()),
      { message: "La CURP no tiene un formato válido" }
    ),

  rfc: z
    .string()
    .trim()
    .max(13, "Máximo 13 caracteres")
    .refine(
      (value) =>
        value === "" ||
        /^([A-Z&Ñ]{3,4})\d{6}([A-Z\d]{3})$/.test(value.toUpperCase()),
      { message: "El RFC no tiene un formato válido" }
    ),

  nss: z
    .string()
    .trim()
    .max(11, "Máximo 11 caracteres")
    .refine((value) => value === "" || /^\d{11}$/.test(value), {
      message: "El NSS debe contener exactamente 11 dígitos",
    }),

  sexo: z.enum(["NoEspecificado", "Hombre", "Mujer", "Otro"]),
  estadoCivil: z.enum([
    "NoEspecificado",
    "Soltero",
    "Casado",
    "Divorciado",
    "Viudo",
    "UnionLibre",
  ]),
  nacionalidad: z.string().trim().max(80, "Máximo 80 caracteres"),

  direccionCalle: z.string().trim().max(150, "Máximo 150 caracteres"),
  direccionNumeroExterior: z.string().trim().max(20, "Máximo 20 caracteres"),
  direccionNumeroInterior: z.string().trim().max(20, "Máximo 20 caracteres"),
  direccionColonia: z.string().trim().max(120, "Máximo 120 caracteres"),
  direccionCiudad: z.string().trim().max(120, "Máximo 120 caracteres"),
  direccionEstado: z.string().trim().max(120, "Máximo 120 caracteres"),
  direccionCodigoPostal: z
    .string()
    .trim()
    .max(5, "Máximo 5 caracteres")
    .refine((value) => value === "" || /^\d{5}$/.test(value), {
      message: "El código postal debe contener exactamente 5 dígitos",
    }),

  codigoPostalFiscal: z
    .string()
    .trim()
    .max(5, "Máximo 5 caracteres")
    .refine((value) => value === "" || /^\d{5}$/.test(value), {
      message: "El código postal fiscal debe contener exactamente 5 dígitos",
    }),

  entidadFiscal: z.string().trim().max(120, "Máximo 120 caracteres"),

  contactoEmergenciaNombre: z
    .string()
    .trim()
    .max(150, "Máximo 150 caracteres"),

  contactoEmergenciaTelefono: z
    .string()
    .trim()
    .max(15, "Máximo 15 caracteres")
    .refine((value) => value === "" || /^\d{10,15}$/.test(value), {
      message:
        "El teléfono de emergencia debe contener entre 10 y 15 dígitos",
    }),

  contactoEmergenciaParentesco: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres"),
});

type EmpleadoFormInput = z.input<typeof empleadoSchema>;
type EmpleadoFormValues = z.output<typeof empleadoSchema>;

const TIPOS_BAJA: { value: TipoBajaEmpleado; label: string }[] = [
  { value: "VOLUNTARIA", label: "Voluntaria" },
  { value: "INVOLUNTARIA", label: "Involuntaria" },
  { value: "TERMINO_CONTRATO", label: "Término de contrato" },
  { value: "ABANDONO", label: "Abandono" },
  { value: "JUBILACION", label: "Jubilación" },
  { value: "DEFUNCION", label: "Defunción" },
  { value: "OTRA", label: "Otra" },
];

const tableCellTruncateSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
} as const;

const tableActionGridSx = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 34px)",
  gap: 0.75,
  justifyContent: "end",
  alignItems: "center",
  minWidth: 236,
} as const;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.response?.data?.error;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    return `${error.response?.status ?? ""} ${
      error.response?.statusText ?? error.message
    }`.trim();
  }

  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeUpperOptional(value: string) {
  const normalized = normalizeOptional(value);
  return normalized ? normalized.toUpperCase() : null;
}

function normalizeDigitsOptional(value: string) {
  const normalized = value.replace(/\D/g, "").trim();
  return normalized === "" ? null : normalized;
}

function normalizeDateInput(value?: string | null) {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return raw.slice(0, 10);
  }

  const match = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const normalized =
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
  }).format(date);
}

function normalizeSortText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function compareSortText(a?: string | null, b?: string | null) {
  return normalizeSortText(a).localeCompare(normalizeSortText(b), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function getPuestoDepartamentoId(puesto: Puesto) {
  const maybeDepartamentoId =
    (puesto as Puesto & {
      departamentoID?: number | string | null;
      departamento?: { id?: number | string | null } | null;
    }).departamentoId ??
    (puesto as Puesto & {
      departamentoID?: number | string | null;
      departamento?: { id?: number | string | null } | null;
    }).departamentoID ??
    (puesto as Puesto & {
      departamento?: { id?: number | string | null } | null;
    }).departamento?.id;

  return Number(maybeDepartamentoId ?? 0);
}

function normalizeRoles(roles?: string[] | null): string[] {
  return [
    ...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function hasSomeRole(roles?: string[] | null, allowed: string[] = []) {
  const normalized = normalizeRoles(roles);
  return allowed.some((role) => normalized.includes(role.toUpperCase()));
}

function empleadoStatusChipSx(
  estatus: Empleado["estatusLaboralActual"],
  activo: boolean
) {
  const isActivo = estatus === "ACTIVO" && activo;

  return {
    fontWeight: 800,
    borderRadius: "999px",
    height: 24,
    width: "fit-content",
    maxWidth: "100%",
    alignSelf: "flex-start",
    "& .MuiChip-label": {
      px: 1.1,
      fontSize: "0.76rem",
      lineHeight: 1,
    },
    color: isActivo ? "#166534" : "#991b1b",
    borderColor: isActivo
      ? alpha("#16a34a", 0.22)
      : alpha("#dc2626", 0.22),
    backgroundColor: isActivo
      ? alpha("#16a34a", 0.05)
      : alpha("#dc2626", 0.05),
  } as const;
}

function cuentaStatusChipSx(hasAccount: boolean, hasEmail: boolean) {
  if (hasAccount) {
    return {
      fontWeight: 800,
      borderRadius: "999px",
      height: 24,
      width: "fit-content",
      maxWidth: "100%",
      alignSelf: "flex-start",
      "& .MuiChip-label": {
        px: 1.1,
        fontSize: "0.76rem",
        lineHeight: 1,
      },
      color: "#166534",
      borderColor: alpha("#16a34a", 0.22),
      backgroundColor: alpha("#16a34a", 0.05),
    } as const;
  }

  if (hasEmail) {
    return {
      fontWeight: 800,
      borderRadius: "999px",
      height: 24,
      width: "fit-content",
      maxWidth: "100%",
      alignSelf: "flex-start",
      "& .MuiChip-label": {
        px: 1.1,
        fontSize: "0.76rem",
        lineHeight: 1,
      },
      color: "#b45309",
      borderColor: alpha("#b45309", 0.22),
      backgroundColor: alpha("#b45309", 0.05),
    } as const;
  }

  return {
    fontWeight: 800,
    borderRadius: "999px",
    height: 24,
    width: "fit-content",
    maxWidth: "100%",
    alignSelf: "flex-start",
    "& .MuiChip-label": {
      px: 1.1,
      fontSize: "0.76rem",
      lineHeight: 1,
    },
    color: "#475569",
    borderColor: alpha("#475569", 0.18),
    backgroundColor: alpha("#475569", 0.05),
  } as const;
}

function actionIconButtonSx(
  variant:
    | "view"
    | "edit"
    | "baja"
    | "reingreso"
    | "pdf"
    | "createAccount"
    | "linkAccount"
) {
  const map = {
    view: {
      color: "#0f766e",
      border: alpha("#0f766e", 0.16),
      bg: alpha("#0f766e", 0.05),
      hover: alpha("#0f766e", 0.1),
    },
    edit: {
      color: "#1d4ed8",
      border: alpha("#1d4ed8", 0.16),
      bg: alpha("#1d4ed8", 0.05),
      hover: alpha("#1d4ed8", 0.1),
    },
    baja: {
      color: "#b45309",
      border: alpha("#b45309", 0.18),
      bg: alpha("#b45309", 0.05),
      hover: alpha("#b45309", 0.1),
    },
    reingreso: {
      color: "#15803d",
      border: alpha("#15803d", 0.18),
      bg: alpha("#15803d", 0.05),
      hover: alpha("#15803d", 0.1),
    },
    pdf: {
      color: "#b91c1c",
      border: alpha("#b91c1c", 0.18),
      bg: alpha("#b91c1c", 0.05),
      hover: alpha("#b91c1c", 0.1),
    },
    createAccount: {
      color: "#4338ca",
      border: alpha("#4338ca", 0.18),
      bg: alpha("#4338ca", 0.05),
      hover: alpha("#4338ca", 0.1),
    },
    linkAccount: {
      color: "#0369a1",
      border: alpha("#0369a1", 0.18),
      bg: alpha("#0369a1", 0.05),
      hover: alpha("#0369a1", 0.1),
    },
  }[variant];

  return {
    width: 34,
    height: 34,
    border: `1px solid ${map.border}`,
    borderRadius: "12px",
    color: map.color,
    backgroundColor: map.bg,
    "&:hover": {
      backgroundColor: map.hover,
    },
  } as const;
}

function getEmpleadoNombre(
  empleado: Pick<Empleado, "nombres" | "apellidoPaterno" | "apellidoMaterno">
) {
  return [empleado.nombres, empleado.apellidoPaterno, empleado.apellidoMaterno ?? ""]
    .filter(Boolean)
    .join(" ");
}

function toUpperInput(value: string) {
  return value.toUpperCase().replace(/\s+/g, "");
}

function digitsOnlyInput(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeNumEmpleadoInput(value: string) {
  return value.toUpperCase().replace(/\s+/g, "");
}

function getEmpleadoTieneCuenta(row: Empleado) {
  return Boolean((row as EmpleadoCuentaInfo).tieneCuenta);
}

function getEmpleadoUsuarioEmail(row: Empleado) {
  return (row as EmpleadoCuentaInfo).usuarioEmail ?? null;
}

function getEmpleadoUsuarioRole(row: Empleado) {
  return (row as EmpleadoCuentaInfo).usuarioRole ?? null;
}

function EmpleadoDialog({
  open,
  onClose,
  onSubmit,
  saving,
  initialValues,
  departamentos,
  puestos,
  sucursales,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SaveEmpleadoInput, photoFile?: File | null) => Promise<void>;
  saving: boolean;
  initialValues?: Empleado | null;
  departamentos: Departamento[];
  puestos: Puesto[];
  sucursales: SucursalDto[];
}) {
  const isEdit = !!initialValues;
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [suggestingNumero, setSuggestingNumero] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [changingNumero, setChangingNumero] = useState(false);

  const [showChangeNumero, setShowChangeNumero] = useState(false);
  const [numeroNuevo, setNumeroNuevo] = useState("");
  const [motivoCambioNumero, setMotivoCambioNumero] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [localPhotoPreviewUrl, setLocalPhotoPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EmpleadoFormInput, undefined, EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    mode: "onBlur",
    defaultValues: {
      numEmpleado: "",
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      fechaNacimiento: "",
      telefono: "",
      email: "",
      fechaIngreso: new Date().toISOString().slice(0, 10),
      activo: true,
      departamentoId: 0,
      puestoId: 0,
      sucursalId: 0,
      aprobadorPrimarioEmpleadoId: 0,
      aprobadorSecundarioEmpleadoId: 0,

      curp: "",
      rfc: "",
      nss: "",
      sexo: "NoEspecificado",
      estadoCivil: "NoEspecificado",
      nacionalidad: "",

      direccionCalle: "",
      direccionNumeroExterior: "",
      direccionNumeroInterior: "",
      direccionColonia: "",
      direccionCiudad: "",
      direccionEstado: "",
      direccionCodigoPostal: "",

      codigoPostalFiscal: "",
      entidadFiscal: "",

      contactoEmergenciaNombre: "",
      contactoEmergenciaTelefono: "",
      contactoEmergenciaParentesco: "",
    },
  });

  useEffect(() => {
    return () => {
      if (localPhotoPreviewUrl) {
        URL.revokeObjectURL(localPhotoPreviewUrl);
      }
    };
  }, [localPhotoPreviewUrl]);

  useEffect(() => {
    if (!open) return;

    setActiveStep(0);
    setShowChangeNumero(false);
    setNumeroNuevo("");
    setMotivoCambioNumero("");
    setPendingPhotoFile(null);

    if (localPhotoPreviewUrl) {
      URL.revokeObjectURL(localPhotoPreviewUrl);
      setLocalPhotoPreviewUrl(null);
    }

    setPhotoUrl(resolveEmpleadoPhotoUrl(initialValues?.fotoUrl));
    setPhotoName(initialValues?.fotoNombreOriginal ?? null);

    reset({
      numEmpleado: initialValues?.numEmpleado ?? "",
      nombres: initialValues?.nombres ?? "",
      apellidoPaterno: initialValues?.apellidoPaterno ?? "",
      apellidoMaterno: initialValues?.apellidoMaterno ?? "",
      fechaNacimiento: normalizeDateInput(initialValues?.fechaNacimiento),
      telefono: initialValues?.telefono ?? "",
      email: initialValues?.email ?? "",
      fechaIngreso:
        normalizeDateInput(initialValues?.fechaIngreso) ||
        new Date().toISOString().slice(0, 10),
      activo: initialValues?.activo ?? true,
      departamentoId: Number(initialValues?.departamentoId ?? 0),
      puestoId: Number(initialValues?.puestoId ?? 0),
      sucursalId: Number(initialValues?.sucursalId ?? 0),
      aprobadorPrimarioEmpleadoId: Number(initialValues?.aprobadorPrimarioEmpleadoId ?? 0),
      aprobadorSecundarioEmpleadoId: Number(initialValues?.aprobadorSecundarioEmpleadoId ?? 0),

      curp: initialValues?.curp ?? "",
      rfc: initialValues?.rfc ?? "",
      nss: initialValues?.nss ?? "",
      sexo: initialValues?.sexo ?? "NoEspecificado",
      estadoCivil: initialValues?.estadoCivil ?? "NoEspecificado",
      nacionalidad: initialValues?.nacionalidad ?? "",

      direccionCalle: initialValues?.direccionCalle ?? "",
      direccionNumeroExterior: initialValues?.direccionNumeroExterior ?? "",
      direccionNumeroInterior: initialValues?.direccionNumeroInterior ?? "",
      direccionColonia: initialValues?.direccionColonia ?? "",
      direccionCiudad: initialValues?.direccionCiudad ?? "",
      direccionEstado: initialValues?.direccionEstado ?? "",
      direccionCodigoPostal: initialValues?.direccionCodigoPostal ?? "",

      codigoPostalFiscal: initialValues?.codigoPostalFiscal ?? "",
      entidadFiscal: initialValues?.entidadFiscal ?? "",

      contactoEmergenciaNombre: initialValues?.contactoEmergenciaNombre ?? "",
      contactoEmergenciaTelefono: initialValues?.contactoEmergenciaTelefono ?? "",
      contactoEmergenciaParentesco:
        initialValues?.contactoEmergenciaParentesco ?? "",
    });
  }, [initialValues, open, reset, localPhotoPreviewUrl]);

  const departamentoId = Number(watch("departamentoId") ?? 0);
  const puestoId = Number(watch("puestoId") ?? 0);
  const sucursalId = Number(watch("sucursalId") ?? 0);
  const aprobadorPrimarioEmpleadoId = Number(watch("aprobadorPrimarioEmpleadoId") ?? 0);
  const aprobadorSecundarioEmpleadoId = Number(watch("aprobadorSecundarioEmpleadoId") ?? 0);
  const activo = !!watch("activo");
  const numEmpleado = watch("numEmpleado");

  const effectivePhotoUrl = localPhotoPreviewUrl || photoUrl;
  const aprobadoresQuery = useQuery<Empleado[], Error>({
    queryKey: ["empleados-aprobadores-select"],
    enabled: Boolean(open),
    queryFn: async () => {
      const data = await getEmpleados({
        page: 1,
        pageSize: 2000,
        activo: true,
        sort: "id",
        dir: "asc",
      });

      return [...(data.items ?? [])].sort((a, b) => {
        const nameA = [a.nombres, a.apellidoPaterno, a.apellidoMaterno]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-MX");

        const nameB = [b.nombres, b.apellidoPaterno, b.apellidoMaterno]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-MX");

        return nameA.localeCompare(nameB, "es-MX");
      });
    },
  });

  const aprobadoresOptions = useMemo<Empleado[]>(
    () =>
      (aprobadoresQuery.data ?? []).filter(
        (empleado: Empleado) => empleado.id !== initialValues?.id
      ),
    [aprobadoresQuery.data, initialValues?.id]
  );


  const puestosDisponibles = useMemo(() => {
    if (departamentoId <= 0) return [];
    return puestos.filter(
      (puesto) => getPuestoDepartamentoId(puesto) === departamentoId
    );
  }, [departamentoId, puestos]);
useEffect(() => {
    if (puestoId <= 0) return;
    const exists = puestosDisponibles.some((puesto) => puesto.id === puestoId);
    if (!exists) {
      setValue("puestoId", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [puestoId, puestosDisponibles, setValue]);

  const stepFields: Array<Array<keyof EmpleadoFormInput>> = [
    [
      "numEmpleado",
      "nombres",
      "apellidoPaterno",
      "apellidoMaterno",
      "fechaNacimiento",
      "telefono",
      "email",
      "fechaIngreso",
      "activo",
      "departamentoId",
      "puestoId",
      "sucursalId",
    ],
    ["curp", "rfc", "nss", "sexo", "estadoCivil", "nacionalidad"],
    [
      "direccionCalle",
      "direccionNumeroExterior",
      "direccionNumeroInterior",
      "direccionColonia",
      "direccionCiudad",
      "direccionEstado",
      "direccionCodigoPostal",
      "codigoPostalFiscal",
      "entidadFiscal",
    ],
    [
      "contactoEmergenciaNombre",
      "contactoEmergenciaTelefono",
      "contactoEmergenciaParentesco",
    ],
  ];

  const handleNext = async () => {
    const isStepValid = await trigger(stepFields[activeStep]);
    if (!isStepValid) return;
    setActiveStep((current) =>
      Math.min(current + 1, EMPLEADO_FORM_STEPS.length - 1)
    );
  };

  const handleBack = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleSuggestNumero = async () => {
    try {
      setSuggestingNumero(true);
      const data = await getSiguienteNumeroEmpleadoSugerido();
      setValue("numEmpleado", data.numEmpleadoSugerido, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setSuggestingNumero(false);
    }
  };

  const handleSelectPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isEdit && initialValues?.id) {
      try {
        setUploadingPhoto(true);
        const result = await uploadEmpleadoPhoto(initialValues.id, file);
        setPhotoUrl(resolveEmpleadoPhotoUrl(result.fotoUrl));
        setPhotoName(result.fotoNombreOriginal ?? file.name);
        void queryClient.invalidateQueries({ queryKey: ["empleados"] });
        showSnackbar("Foto actualizada correctamente.", "success");
      } catch (error) {
        showSnackbar(getErrorMessage(error), "error");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setUploadingPhoto(false);
      }

      return;
    }

    if (localPhotoPreviewUrl) {
      URL.revokeObjectURL(localPhotoPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingPhotoFile(file);
    setLocalPhotoPreviewUrl(previewUrl);
    setPhotoName(file.name);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (isEdit && initialValues?.id) {
      try {
        setDeletingPhoto(true);
        await deleteEmpleadoPhoto(initialValues.id);
        setPhotoUrl(null);
        setPhotoName(null);
        void queryClient.invalidateQueries({ queryKey: ["empleados"] });
        showSnackbar("Foto eliminada correctamente.", "success");
      } catch (error) {
        showSnackbar(getErrorMessage(error), "error");
      } finally {
        setDeletingPhoto(false);
      }

      return;
    }

    if (localPhotoPreviewUrl) {
      URL.revokeObjectURL(localPhotoPreviewUrl);
    }

    setPendingPhotoFile(null);
    setLocalPhotoPreviewUrl(null);
    setPhotoName(null);
  };

  const handleChangeNumero = async () => {
    if (!initialValues?.id) return;

    const nuevo = normalizeNumEmpleadoInput(numeroNuevo);
    const motivo = motivoCambioNumero.trim();

    if (!nuevo) {
      showSnackbar("Debes capturar el nuevo número de empleado.", "error");
      return;
    }

    if (!motivo) {
      showSnackbar("Debes capturar el motivo del cambio.", "error");
      return;
    }

    try {
      setChangingNumero(true);
      const data = await cambiarNumeroEmpleado(initialValues.id, {
        numEmpleadoNuevo: nuevo,
        motivo,
      });

      const nuevoConfirmado =
        typeof data?.numEmpleado === "string" && data.numEmpleado.trim()
          ? data.numEmpleado
          : nuevo;

      setValue("numEmpleado", nuevoConfirmado, {
        shouldDirty: true,
        shouldValidate: true,
      });

      setNumeroNuevo("");
      setMotivoCambioNumero("");
      setShowChangeNumero(false);

      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      showSnackbar("Número de empleado actualizado.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setChangingNumero(false);
    }
  };

  const submitForm = async (values: EmpleadoFormValues) => {
    const aprobadorPrimarioId = Number(values.aprobadorPrimarioEmpleadoId ?? 0);
    const aprobadorSecundarioId = Number(values.aprobadorSecundarioEmpleadoId ?? 0);

    if (initialValues?.id && aprobadorPrimarioId === initialValues.id) {
      showSnackbar("El empleado no puede ser su propio aprobador primario.", "warning");
      return;
    }

    if (initialValues?.id && aprobadorSecundarioId === initialValues.id) {
      showSnackbar("El empleado no puede ser su propio aprobador secundario.", "warning");
      return;
    }

    if (aprobadorPrimarioId > 0 && aprobadorPrimarioId === aprobadorSecundarioId) {
      showSnackbar("El aprobador primario y secundario no pueden ser el mismo empleado.", "warning");
      return;
    }

    await onSubmit(
      {
        numEmpleado: normalizeOptional(
          normalizeNumEmpleadoInput(values.numEmpleado ?? "")
        ),
        nombres: values.nombres.trim(),
        apellidoPaterno: values.apellidoPaterno.trim(),
        apellidoMaterno: normalizeOptional(values.apellidoMaterno ?? ""),
        fechaNacimiento: normalizeOptional(values.fechaNacimiento ?? ""),
        telefono: normalizeDigitsOptional(values.telefono ?? ""),
        email: normalizeOptional(values.email ?? ""),
        fechaIngreso: values.fechaIngreso,
        activo: values.activo,
        departamentoId: Number(values.departamentoId),
        puestoId: Number(values.puestoId),
        sucursalId:
          Number(values.sucursalId) > 0 ? Number(values.sucursalId) : null,
        aprobadorPrimarioEmpleadoId:
          aprobadorPrimarioId > 0 ? aprobadorPrimarioId : null,
        aprobadorSecundarioEmpleadoId:
          aprobadorSecundarioId > 0 ? aprobadorSecundarioId : null,

        curp: normalizeUpperOptional(values.curp ?? ""),
        rfc: normalizeUpperOptional(values.rfc ?? ""),
        nss: normalizeDigitsOptional(values.nss ?? ""),
        sexo: values.sexo,
        estadoCivil: values.estadoCivil,
        nacionalidad: normalizeOptional(values.nacionalidad ?? ""),

        direccionCalle: normalizeOptional(values.direccionCalle ?? ""),
        direccionNumeroExterior: normalizeOptional(
          values.direccionNumeroExterior ?? ""
        ),
        direccionNumeroInterior: normalizeOptional(
          values.direccionNumeroInterior ?? ""
        ),
        direccionColonia: normalizeOptional(values.direccionColonia ?? ""),
        direccionCiudad: normalizeOptional(values.direccionCiudad ?? ""),
        direccionEstado: normalizeOptional(values.direccionEstado ?? ""),
        direccionCodigoPostal: normalizeDigitsOptional(
          values.direccionCodigoPostal ?? ""
        ),

        codigoPostalFiscal: normalizeDigitsOptional(
          values.codigoPostalFiscal ?? ""
        ),
        entidadFiscal: normalizeOptional(values.entidadFiscal ?? ""),

        contactoEmergenciaNombre: normalizeOptional(
          values.contactoEmergenciaNombre ?? ""
        ),
        contactoEmergenciaTelefono: normalizeDigitsOptional(
          values.contactoEmergenciaTelefono ?? ""
        ),
        contactoEmergenciaParentesco: normalizeOptional(
          values.contactoEmergenciaParentesco ?? ""
        ),
      },
      pendingPhotoFile
    );
  };

  function renderStepContent() {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  border: `1px dashed ${alpha("#0f172a", 0.14)}`,
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                  backgroundColor: alpha("#0f172a", 0.02),
                }}
              >
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    mx: "auto",
                    mb: 1.5,
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: `1px solid ${alpha("#0f172a", 0.08)}`,
                    backgroundColor: alpha("#0f172a", 0.04),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {effectivePhotoUrl ? (
                    <Box
                      component="img"
                      src={effectivePhotoUrl}
                      alt="Foto de perfil"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin foto
                    </Typography>
                  )}
                </Box>

                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                  Foto de perfil
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  JPG, PNG o WEBP · Máx. 2 MB
                </Typography>

                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handlePhotoChange}
                  />

                  <Button
                    variant="outlined"
                    onClick={handleSelectPhoto}
                    disabled={uploadingPhoto || deletingPhoto || saving}
                  >
                    {uploadingPhoto
                      ? "Subiendo..."
                      : effectivePhotoUrl
                      ? "Reemplazar foto"
                      : "Subir foto"}
                  </Button>

                  <Button
                    variant="text"
                    color="inherit"
                    onClick={handleDeletePhoto}
                    disabled={!effectivePhotoUrl || uploadingPhoto || deletingPhoto || saving}
                  >
                    {deletingPhoto ? "Quitando..." : "Quitar foto"}
                  </Button>
                </Stack>

                {!isEdit && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1.25 }}
                  >
                    La foto se guardará automáticamente al crear el empleado.
                  </Typography>
                )}

                {photoName && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1.25 }}
                  >
                    Archivo: {photoName}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Número de empleado"
                  value={numEmpleado}
                  onChange={(e) =>
                    setValue("numEmpleado", normalizeNumEmpleadoInput(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={!!errors.numEmpleado}
                  helperText={
                    errors.numEmpleado?.message ||
                    (isEdit
                      ? "El cambio se realiza con flujo controlado."
                      : "Puedes capturarlo manualmente, pedir consecutivo o dejarlo vacío para que el backend lo genere.")
                  }
                  fullWidth
                  inputProps={{ maxLength: 30 }}
                  disabled={isEdit}
                />

                <Stack direction="row" spacing={1} alignItems="flex-start">
                  {!isEdit ? (
                    <Button
                      variant="outlined"
                      onClick={() => void handleSuggestNumero()}
                      disabled={suggestingNumero || saving}
                      sx={{ mt: 0.5 }}
                    >
                      {suggestingNumero ? "Sugiriendo..." : "Sugerir consecutivo"}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => setShowChangeNumero((v) => !v)}
                      disabled={changingNumero || saving}
                      sx={{ mt: 0.5 }}
                    >
                      {showChangeNumero ? "Cancelar cambio" : "Cambiar número"}
                    </Button>
                  )}
                </Stack>

                <TextField
                  label="Nombres"
                  {...register("nombres")}
                  error={!!errors.nombres}
                  helperText={errors.nombres?.message}
                  fullWidth
                />

                <TextField
                  label="Apellido paterno"
                  {...register("apellidoPaterno")}
                  error={!!errors.apellidoPaterno}
                  helperText={errors.apellidoPaterno?.message}
                  fullWidth
                />

                <TextField
                  label="Apellido materno"
                  {...register("apellidoMaterno")}
                  error={!!errors.apellidoMaterno}
                  helperText={errors.apellidoMaterno?.message}
                  fullWidth
                />

                <TextField
                  label="Teléfono"
                  value={watch("telefono")}
                  onChange={(e) =>
                    setValue("telefono", digitsOnlyInput(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message}
                  fullWidth
                  inputProps={{ maxLength: 15, inputMode: "numeric" }}
                />

                <TextField
                  label="Correo"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                />

                <TextField
                  label="Fecha de nacimiento"
                  type="date"
                  {...register("fechaNacimiento")}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  label="Fecha de ingreso"
                  type="date"
                  {...register("fechaIngreso")}
                  error={!!errors.fechaIngreso}
                  helperText={errors.fechaIngreso?.message}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  select
                  label="Sucursal"
                  value={sucursalId}
                  onChange={(e) => {
                    setValue("sucursalId", Number(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  error={!!errors.sucursalId}
                  helperText={errors.sucursalId?.message}
                  fullWidth
                >
                  <MenuItem value={0}>Sin sucursal</MenuItem>
                  {sucursales.map((sucursal) => (
                    <MenuItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.clave} - {sucursal.nombre}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Departamento"
                  value={departamentoId}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setValue("departamentoId", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("puestoId", 0, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  error={!!errors.departamentoId}
                  helperText={errors.departamentoId?.message}
                  fullWidth
                >
                  <MenuItem value={0}>Selecciona un departamento</MenuItem>
                  {departamentos.map((dep) => (
                    <MenuItem key={dep.id} value={dep.id}>
                      {dep.clave} - {dep.nombre}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Puesto"
                  value={puestoId}
                  onChange={(e) => {
                    setValue("puestoId", Number(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  error={!!errors.puestoId}
                  helperText={
                    errors.puestoId?.message ||
                    (departamentoId <= 0
                      ? "Primero selecciona un departamento"
                      : puestosDisponibles.length === 0
                      ? "No hay puestos para este departamento"
                      : "")
                  }
                  disabled={departamentoId <= 0 || puestosDisponibles.length === 0}
                  fullWidth
                >
                  <MenuItem value={0}>
                    {departamentoId > 0
                      ? "Selecciona un puesto"
                      : "Primero elige un departamento"}
                  </MenuItem>
                  {puestosDisponibles.map((puesto) => (
                    <MenuItem key={puesto.id} value={puesto.id}>
                      {puesto.clave} - {puesto.nombre}
                    </MenuItem>
                  ))}
                </TextField>


                <TextField
                  select
                  label="Aprobador primario"
                  value={aprobadorPrimarioEmpleadoId}
                  onChange={(e) => {
                    setValue("aprobadorPrimarioEmpleadoId", Number(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  helperText={
                    aprobadoresQuery.isLoading
                      ? "Cargando empleados activos..."
                      : "Jefe directo o responsable principal."
                  }
                  disabled={aprobadoresQuery.isLoading}
                  fullWidth
                >
                  <MenuItem value={0}>Sin aprobador primario</MenuItem>
                  {aprobadoresOptions.map((empleado) => (
                    <MenuItem
                      key={`primario-${empleado.id}`}
                      value={empleado.id}
                      disabled={empleado.id === aprobadorSecundarioEmpleadoId}
                    >
                      {empleado.numEmpleado} - {[empleado.nombres, empleado.apellidoPaterno, empleado.apellidoMaterno]
                        .filter(Boolean)
                        .join(" ")}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Aprobador secundario"
                  value={aprobadorSecundarioEmpleadoId}
                  onChange={(e) => {
                    setValue("aprobadorSecundarioEmpleadoId", Number(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  helperText={
                    aprobadoresQuery.isLoading
                      ? "Cargando empleados activos..."
                      : "Respaldo para aprobación o supervisión alterna."
                  }
                  disabled={aprobadoresQuery.isLoading}
                  fullWidth
                >
                  <MenuItem value={0}>Sin aprobador secundario</MenuItem>
                  {aprobadoresOptions.map((empleado) => (
                    <MenuItem
                      key={`secundario-${empleado.id}`}
                      value={empleado.id}
                      disabled={empleado.id === aprobadorPrimarioEmpleadoId}
                    >
                      {empleado.numEmpleado} - {[empleado.nombres, empleado.apellidoPaterno, empleado.apellidoMaterno]
                        .filter(Boolean)
                        .join(" ")}
                    </MenuItem>
                  ))}
                </TextField>

                {!isEdit ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={activo}
                          onChange={(_, checked) =>
                            setValue("activo", checked, { shouldDirty: true })
                          }
                        />
                      }
                      label={activo ? "Activo" : "Inactivo"}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: 56,
                    }}
                  >
                    <Stack spacing={0.75}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={
                          initialValues?.estatusLaboralActual === "BAJA" || !activo
                            ? "Baja"
                            : "Activo"
                        }
                        sx={empleadoStatusChipSx(
                          initialValues?.estatusLaboralActual ??
                            (activo ? "ACTIVO" : "BAJA"),
                          activo
                        )}
                      />
                      <Typography variant="caption" color="text.secondary">
                        El estado laboral se gestiona desde las acciones Dar baja y Reingresar.
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>

            {isEdit && showChangeNumero && (
              <Box
                sx={{
                  border: `1px solid ${alpha("#0f172a", 0.08)}`,
                  borderRadius: 3,
                  p: 2,
                  backgroundColor: alpha("#0f172a", 0.02),
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Cambio controlado de número de empleado
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
                    gap: 2,
                    alignItems: "start",
                  }}
                >
                  <TextField
                    label="Nuevo número"
                    value={numeroNuevo}
                    onChange={(e) => setNumeroNuevo(normalizeNumEmpleadoInput(e.target.value))}
                    inputProps={{ maxLength: 30 }}
                    fullWidth
                  />

                  <TextField
                    label="Motivo"
                    value={motivoCambioNumero}
                    onChange={(e) => setMotivoCambioNumero(e.target.value)}
                    fullWidth
                  />

                  <Button
                    variant="contained"
                    onClick={() => void handleChangeNumero()}
                    disabled={changingNumero || saving}
                    sx={{ minHeight: 56 }}
                  >
                    {changingNumero ? "Guardando..." : "Aplicar"}
                  </Button>
                </Box>
              </Box>
            )}
          </Stack>
        );

      case 1:
        return (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="CURP"
              value={watch("curp")}
              onChange={(e) =>
                setValue("curp", toUpperInput(e.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.curp}
              helperText={errors.curp?.message}
              fullWidth
              inputProps={{ maxLength: 18 }}
            />

            <TextField
              label="RFC"
              value={watch("rfc")}
              onChange={(e) =>
                setValue("rfc", toUpperInput(e.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.rfc}
              helperText={errors.rfc?.message}
              fullWidth
              inputProps={{ maxLength: 13 }}
            />

            <TextField
              label="NSS"
              value={watch("nss")}
              onChange={(e) =>
                setValue("nss", digitsOnlyInput(e.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.nss}
              helperText={errors.nss?.message}
              fullWidth
              inputProps={{ maxLength: 11, inputMode: "numeric" }}
            />

            <TextField
              select
              label="Sexo"
              value={watch("sexo")}
              onChange={(e) =>
                setValue("sexo", e.target.value as SexoEmpleado, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.sexo}
              helperText={errors.sexo?.message}
              fullWidth
            >
              {SEXO_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Estado civil"
              value={watch("estadoCivil")}
              onChange={(e) =>
                setValue("estadoCivil", e.target.value as EstadoCivilEmpleado, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.estadoCivil}
              helperText={errors.estadoCivil?.message}
              fullWidth
            >
              {ESTADO_CIVIL_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Nacionalidad"
              {...register("nacionalidad")}
              error={!!errors.nacionalidad}
              helperText={errors.nacionalidad?.message}
              fullWidth
            />
          </Box>
        );

      case 2:
        return (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Calle"
              {...register("direccionCalle")}
              error={!!errors.direccionCalle}
              helperText={errors.direccionCalle?.message}
              fullWidth
            />

            <TextField
              label="No. exterior"
              {...register("direccionNumeroExterior")}
              error={!!errors.direccionNumeroExterior}
              helperText={errors.direccionNumeroExterior?.message}
              fullWidth
            />

            <TextField
              label="No. interior"
              {...register("direccionNumeroInterior")}
              error={!!errors.direccionNumeroInterior}
              helperText={errors.direccionNumeroInterior?.message}
              fullWidth
            />

            <TextField
              label="Colonia"
              {...register("direccionColonia")}
              error={!!errors.direccionColonia}
              helperText={errors.direccionColonia?.message}
              fullWidth
            />

            <TextField
              label="Ciudad"
              {...register("direccionCiudad")}
              error={!!errors.direccionCiudad}
              helperText={errors.direccionCiudad?.message}
              fullWidth
            />

            <TextField
              label="Estado"
              {...register("direccionEstado")}
              error={!!errors.direccionEstado}
              helperText={errors.direccionEstado?.message}
              fullWidth
            />

            <TextField
              label="Código postal"
              value={watch("direccionCodigoPostal")}
              onChange={(e) =>
                setValue("direccionCodigoPostal", digitsOnlyInput(e.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.direccionCodigoPostal}
              helperText={errors.direccionCodigoPostal?.message}
              fullWidth
              inputProps={{ maxLength: 5, inputMode: "numeric" }}
            />

            <TextField
              label="Código postal fiscal"
              value={watch("codigoPostalFiscal")}
              onChange={(e) =>
                setValue("codigoPostalFiscal", digitsOnlyInput(e.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={!!errors.codigoPostalFiscal}
              helperText={errors.codigoPostalFiscal?.message}
              fullWidth
              inputProps={{ maxLength: 5, inputMode: "numeric" }}
            />

            <TextField
              label="Entidad fiscal"
              {...register("entidadFiscal")}
              error={!!errors.entidadFiscal}
              helperText={errors.entidadFiscal?.message}
              fullWidth
            />
          </Box>
        );

      case 3:
        return (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Contacto de emergencia"
              {...register("contactoEmergenciaNombre")}
              error={!!errors.contactoEmergenciaNombre}
              helperText={errors.contactoEmergenciaNombre?.message}
              fullWidth
            />

            <TextField
              label="Teléfono de emergencia"
              value={watch("contactoEmergenciaTelefono")}
              onChange={(e) =>
                setValue(
                  "contactoEmergenciaTelefono",
                  digitsOnlyInput(e.target.value),
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  }
                )
              }
              error={!!errors.contactoEmergenciaTelefono}
              helperText={errors.contactoEmergenciaTelefono?.message}
              fullWidth
              inputProps={{ maxLength: 15, inputMode: "numeric" }}
            />

            <TextField
              label="Parentesco"
              {...register("contactoEmergenciaParentesco")}
              error={!!errors.contactoEmergenciaParentesco}
              helperText={errors.contactoEmergenciaParentesco?.message}
              fullWidth
            />
          </Box>
        );

      default:
        return null;
    }
  }

  const stepMeta = [
    {
      icon: <BadgeOutlinedIcon fontSize="small" />,
      title: "Datos generales",
      subtitle: "Información operativa, número de empleado, foto y asignación organizacional.",
    },
    {
      icon: <BadgeOutlinedIcon fontSize="small" />,
      title: "Identificación",
      subtitle: "Datos oficiales y catálogos personales básicos para RH.",
    },
    {
      icon: <HomeWorkOutlinedIcon fontSize="small" />,
      title: "Domicilio y fiscal",
      subtitle: "Dirección de residencia y referencia fiscal básica para expediente.",
    },
    {
      icon: <ContactPhoneOutlinedIcon fontSize="small" />,
      title: "Contacto de emergencia",
      subtitle: "Persona y teléfono de contacto ante incidentes o urgencias.",
    },
  ] as const;

  const busy =
    saving ||
    suggestingNumero ||
    uploadingPhoto ||
    deletingPhoto ||
    changingNumero;

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{isEdit ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>

      <DialogContent dividers>
        <Box component="form" sx={{ mt: 1 }} onSubmit={handleSubmit(submitForm)}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {EMPLEADO_FORM_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack spacing={2.5}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                {stepMeta[activeStep].icon}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {stepMeta[activeStep].title}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {stepMeta[activeStep].subtitle}
              </Typography>
            </Box>

            <Divider />

            {renderStepContent()}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Button onClick={onClose} disabled={busy} color="inherit">
          Cancelar
        </Button>

        <Stack direction="row" spacing={1}>
          <Button onClick={handleBack} disabled={busy || activeStep === 0}>
            Anterior
          </Button>

          {activeStep < EMPLEADO_FORM_STEPS.length - 1 ? (
            <Button variant="contained" onClick={() => void handleNext()} disabled={busy}>
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(submitForm)}
              variant="contained"
              disabled={busy}
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

function BajaEmpleadoDialog({
  open,
  empleado,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  empleado: Empleado | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: DarBajaEmpleadoInput) => Promise<void>;
}) {
  const [fechaBaja, setFechaBaja] = useState(new Date().toISOString().slice(0, 10));
  const [tipoBaja, setTipoBaja] = useState<TipoBajaEmpleado>("VOLUNTARIA");
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [recontratable, setRecontratable] = useState(true);
  const [desactivarUsuario, setDesactivarUsuario] = useState(true);

  useEffect(() => {
    if (!open) return;
    setFechaBaja(new Date().toISOString().slice(0, 10));
    setTipoBaja("VOLUNTARIA");
    setMotivo("");
    setComentario("");
    setRecontratable(true);
    setDesactivarUsuario(true);
  }, [open, empleado]);

  const submit = async () => {
    await onSubmit({
      fechaBaja,
      tipoBaja,
      motivo: normalizeOptional(motivo),
      comentario: normalizeOptional(comentario),
      recontratable,
      desactivarUsuario,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Dar de baja a empleado</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="warning">
            Esta acción registrará una baja formal y actualizará el estatus laboral del empleado.
          </Alert>

          <Box>
            <Typography fontWeight={800}>
              {empleado ? getEmpleadoNombre(empleado) : "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empleado?.numEmpleado ?? "-"}
            </Typography>
          </Box>

          <TextField
            label="Fecha de baja"
            type="date"
            value={fechaBaja}
            onChange={(e) => setFechaBaja(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            select
            label="Tipo de baja"
            value={tipoBaja}
            onChange={(e) => setTipoBaja(e.target.value as TipoBajaEmpleado)}
            fullWidth
          >
            {TIPOS_BAJA.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            fullWidth
          />

          <TextField
            label="Comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

          <FormControlLabel
            control={
              <Switch
                checked={recontratable}
                onChange={(_, checked) => setRecontratable(checked)}
              />
            }
            label={recontratable ? "Recontratable" : "No recontratable"}
          />

          <FormControlLabel
            control={
              <Switch
                checked={desactivarUsuario}
                onChange={(_, checked) => setDesactivarUsuario(checked)}
              />
            }
            label={
              desactivarUsuario
                ? "Desactivar acceso de usuario"
                : "Mantener acceso de usuario"
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          color="warning"
          disabled={saving}
          startIcon={<PersonOffRoundedIcon />}
        >
          {saving ? "Procesando..." : "Confirmar baja"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ReingresoEmpleadoDialog({
  open,
  empleado,
  saving,
  onClose,
  onSubmit,
  departamentos,
  puestos,
  sucursales,
}: {
  open: boolean;
  empleado: Empleado | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ReingresarEmpleadoInput) => Promise<void>;
  departamentos: Departamento[];
  puestos: Puesto[];
  sucursales: SucursalDto[];
}) {
  const [fechaReingreso, setFechaReingreso] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [departamentoId, setDepartamentoId] = useState(0);
  const [puestoId, setPuestoId] = useState(0);
  const [sucursalId, setSucursalId] = useState(0);
  const [comentario, setComentario] = useState("");
  const [reactivarUsuario, setReactivarUsuario] = useState(true);

  useEffect(() => {
    if (!open) return;

    setFechaReingreso(new Date().toISOString().slice(0, 10));
    setDepartamentoId(Number(empleado?.departamentoId ?? 0));
    setPuestoId(Number(empleado?.puestoId ?? 0));
    setSucursalId(Number(empleado?.sucursalId ?? 0));
    setComentario("");
    setReactivarUsuario(true);
  }, [open, empleado]);

  const puestosDisponibles = useMemo(() => {
    if (departamentoId <= 0) return [];
    return puestos.filter(
      (puesto) => getPuestoDepartamentoId(puesto) === departamentoId
    );
  }, [departamentoId, puestos]);
useEffect(() => {
    if (puestoId <= 0) return;
    const exists = puestosDisponibles.some((puesto) => puesto.id === puestoId);
    if (!exists) setPuestoId(0);
  }, [puestoId, puestosDisponibles]);

  const submit = async () => {
    await onSubmit({
      fechaReingreso,
      departamentoId: departamentoId > 0 ? departamentoId : null,
      puestoId: puestoId > 0 ? puestoId : null,
      sucursalId: sucursalId > 0 ? sucursalId : null,
      comentario: normalizeOptional(comentario),
      reactivarUsuario,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reingresar empleado</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="success">
            El reingreso reactiva el estado laboral y conserva el historial del empleado.
          </Alert>

          <Box>
            <Typography fontWeight={800}>
              {empleado ? getEmpleadoNombre(empleado) : "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empleado?.numEmpleado ?? "-"}
            </Typography>
          </Box>

          <TextField
            label="Fecha de reingreso"
            type="date"
            value={fechaReingreso}
            onChange={(e) => setFechaReingreso(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            select
            label="Sucursal"
            value={sucursalId}
            onChange={(e) => setSucursalId(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value={0}>Sin sucursal</MenuItem>
            {sucursales.map((sucursal) => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                {sucursal.clave} - {sucursal.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Departamento"
            value={departamentoId}
            onChange={(e) => {
              const value = Number(e.target.value);
              setDepartamentoId(value);
              setPuestoId(0);
            }}
            fullWidth
          >
            <MenuItem value={0}>Selecciona un departamento</MenuItem>
            {departamentos.map((dep) => (
              <MenuItem key={dep.id} value={dep.id}>
                {dep.clave} - {dep.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Puesto"
            value={puestoId}
            onChange={(e) => setPuestoId(Number(e.target.value))}
            disabled={departamentoId <= 0 || puestosDisponibles.length === 0}
            helperText={
              departamentoId <= 0
                ? "Primero selecciona un departamento"
                : puestosDisponibles.length === 0
                ? "No hay puestos para este departamento"
                : ""
            }
            fullWidth
          >
            <MenuItem value={0}>
              {departamentoId > 0
                ? "Selecciona un puesto"
                : "Primero elige un departamento"}
            </MenuItem>
            {puestosDisponibles.map((puesto) => (
              <MenuItem key={puesto.id} value={puesto.id}>
                {puesto.clave} - {puesto.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

          <FormControlLabel
            control={
              <Switch
                checked={reactivarUsuario}
                onChange={(_, checked) => setReactivarUsuario(checked)}
              />
            }
            label={
              reactivarUsuario
                ? "Reactivar acceso de usuario"
                : "Mantener usuario sin acceso"
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          color="success"
          disabled={saving}
          startIcon={<ReplayRoundedIcon />}
        >
          {saving ? "Procesando..." : "Confirmar reingreso"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CreateAccountDialog({
  open,
  empleado,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  empleado: Empleado | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    email: string;
    role: AppUserRole;
    password: string;
    isActive: boolean;
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppUserRole>("EMPLEADO");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setEmail(empleado?.email ?? "");
    setRole("EMPLEADO");
    setPassword("");
    setIsActive(true);
  }, [open, empleado]);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) return;
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) return;
    if (!normalizedPassword) return;

    await onSubmit({
      email: normalizedEmail,
      role,
      password: normalizedPassword,
      isActive,
    });
  };

  const canSubmit =
    email.trim() !== "" &&
    /\S+@\S+\.\S+/.test(email.trim()) &&
    password.trim() !== "";

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Crear cuenta para empleado</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            Se creará una cuenta nueva y quedará ligada automáticamente al empleado.
          </Alert>

          <Box>
            <Typography fontWeight={800}>
              {empleado ? getEmpleadoNombre(empleado) : "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empleado?.numEmpleado ?? "-"}
            </Typography>
          </Box>

          <TextField
            label="Correo de acceso"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            fullWidth
            helperText="Será el usuario con el que iniciará sesión."
          />

          <TextField
            select
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value as AppUserRole)}
            fullWidth
          >
            {ACCOUNT_ROLE_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Contraseña temporal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="text"
            fullWidth
            helperText="El usuario tendrá que cambiarla al entrar."
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(_, checked) => setIsActive(checked)}
              />
            }
            label={isActive ? "Cuenta activa" : "Cuenta inactiva"}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancelar
        </Button>

        <Button
          onClick={() => void submit()}
          variant="contained"
          disabled={saving || !canSubmit}
          startIcon={<ManageAccountsRoundedIcon />}
        >
          {saving ? "Creando..." : "Crear cuenta"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LinkUserByEmailDialog({
  open,
  empleado,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  empleado: Empleado | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const email = empleado?.email?.trim() ?? "";
  const canLink = email !== "";

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Vincular usuario por email</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity={canLink ? "info" : "warning"}>
            {canLink
              ? "Se buscará una cuenta existente con el mismo correo del empleado y se ligará automáticamente."
              : "Este empleado no tiene correo capturado. Primero guarda un email en el empleado."}
          </Alert>

          <Box>
            <Typography fontWeight={800}>
              {empleado ? getEmpleadoNombre(empleado) : "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empleado?.numEmpleado ?? "-"}
            </Typography>
          </Box>

          <TextField
            label="Correo del empleado"
            value={email}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancelar
        </Button>

        <Button
          onClick={() => void onSubmit()}
          variant="contained"
          disabled={saving || !canLink}
          startIcon={<LinkRoundedIcon />}
        >
          {saving ? "Vinculando..." : "Vincular"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EmpleadosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const { roles } = useAuth();

  const [search, setSearch] = useState("");
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [sucursalFilter, setSucursalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstadoFiltroEmpleado>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [bajaTarget, setBajaTarget] = useState<Empleado | null>(null);
  const [reingresoTarget, setReingresoTarget] = useState<Empleado | null>(null);
  const [createAccountTarget, setCreateAccountTarget] = useState<Empleado | null>(null);
  const [linkAccountTarget, setLinkAccountTarget] = useState<Empleado | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] =
    useState<EmpleadoSortField>("numEmpleado");
  const [sortDirection, setSortDirection] =
    useState<EmpleadoSortDirection>("asc");
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingFichaId, setDownloadingFichaId] = useState<number | null>(
    null
  );

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const canManageEmpleados = hasSomeRole(roles, ["ADMIN", "RRHH"]);

  const empleadosQuery = useQuery<Empleado[], Error>({
    queryKey: ["empleados", statusFilter],
    queryFn: async () => {
      const data = await getEmpleados({
        page: 1,
        pageSize: 500,
        sort: "id",
        dir: "desc",
        activo:
          statusFilter === "ACTIVO"
            ? true
            : statusFilter === "BAJA"
            ? false
            : undefined,
      });

      return Array.isArray(data.items) ? data.items : [];
    },
  });

  const departamentosQuery = useQuery<Departamento[], Error>({
    queryKey: ["departamentos"],
    queryFn: () => getDepartamentos(),
  });

  const puestosQuery = useQuery<Puesto[], Error>({
    queryKey: ["puestos"],
    queryFn: () => getPuestos(),
  });

  const sucursalesQuery = useQuery<SucursalDto[], Error>({
    queryKey: ["sucursales-select"],
    queryFn: () => getSucursales({ activo: true }),
  });

  const departamentos: Departamento[] = departamentosQuery.data ?? [];
  const puestos: Puesto[] = puestosQuery.data ?? [];
  const sucursales: SucursalDto[] = sucursalesQuery.data ?? [];

  const departamentosMap = useMemo(() => {
    return new Map(departamentos.map((d) => [Number(d.id), d]));
  }, [departamentos]);

  const puestosMap = useMemo(() => {
    return new Map(puestos.map((p) => [Number(p.id), p]));
  }, [puestos]);

  const sucursalesMap = useMemo(() => {
    return new Map(sucursales.map((s) => [Number(s.id), s]));
  }, [sucursales]);

  const getDepartamentoNombre = (row: Empleado) =>
    row.departamentoNombre ??
    (row.departamentoId
      ? departamentosMap.get(Number(row.departamentoId))?.nombre
      : null) ??
    "-";

  const getPuestoNombre = (row: Empleado) =>
    row.puestoNombre ??
    (row.puestoId ? puestosMap.get(Number(row.puestoId))?.nombre : null) ??
    "-";

  const getSucursalNombre = (row: Empleado) =>
    row.sucursalNombre ??
    (row.sucursalId ? sucursalesMap.get(Number(row.sucursalId))?.nombre : null) ??
    "-";

  const getEstadoLabel = (row: Empleado) =>
    row.estatusLaboralActual === "BAJA" || !row.activo ? "Baja" : "Activo";

  const handleSort = (field: EmpleadoSortField) => {
    setPage(0);

    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      values,
      photoFile,
    }: {
      values: SaveEmpleadoInput;
      photoFile?: File | null;
    }) => {
      if (editing) {
        return updateEmpleado(editing.id, values);
      }

      const created = await createEmpleado(values);

      if (photoFile && created?.id) {
        await uploadEmpleadoPhoto(created.id, photoFile);
      }

      return created;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      setDialogOpen(false);
      setEditing(null);
      showSnackbar(
        editing
          ? "Empleado actualizado."
          : variables.photoFile
          ? "Empleado creado y foto cargada."
          : "Empleado creado.",
        "success"
      );
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const bajaMutation = useMutation({
    mutationFn: async ({
      empleado,
      payload,
    }: {
      empleado: Empleado;
      payload: DarBajaEmpleadoInput;
    }) => darBajaEmpleado(empleado.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      setBajaTarget(null);
      showSnackbar("Baja registrada correctamente.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const reingresoMutation = useMutation({
    mutationFn: async ({
      empleado,
      payload,
    }: {
      empleado: Empleado;
      payload: ReingresarEmpleadoInput;
    }) => reingresarEmpleado(empleado.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      setReingresoTarget(null);
      showSnackbar("Reingreso registrado correctamente.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async ({
      empleado,
      payload,
    }: {
      empleado: Empleado;
      payload: {
        email: string;
        role: AppUserRole;
        password: string;
        isActive: boolean;
      };
    }) => createAccountForEmpleado(empleado.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateAccountTarget(null);
      showSnackbar("Cuenta creada y ligada correctamente.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const linkAccountMutation = useMutation({
    mutationFn: async (empleado: Empleado) => linkUserByEmail(empleado.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setLinkAccountTarget(null);
      showSnackbar("Usuario ligado correctamente por email.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const filteredRows = useMemo<Empleado[]>(() => {
    const rows = empleadosQuery.data ?? [];
    const term = search.trim().toLowerCase();

    return rows.filter((row: Empleado) => {
      const matchesDepartamento =
        !departamentoFilter ||
        String(row.departamentoId ?? "") === String(departamentoFilter);

      const matchesSucursal =
        !sucursalFilter || String(row.sucursalId ?? "") === String(sucursalFilter);

      const matchesStatus =
        statusFilter === ""
          ? true
          : statusFilter === "ACTIVO"
          ? row.activo && row.estatusLaboralActual === "ACTIVO"
          : row.estatusLaboralActual === "BAJA" || !row.activo;

      const matchesSearch =
        !term ||
        (row.numEmpleado ?? "").toLowerCase().includes(term) ||
        getEmpleadoNombre(row).toLowerCase().includes(term) ||
        (row.email ?? "").toLowerCase().includes(term) ||
        (row.curp ?? "").toLowerCase().includes(term) ||
        (row.rfc ?? "").toLowerCase().includes(term) ||
        (row.nss ?? "").toLowerCase().includes(term) ||
        getDepartamentoNombre(row).toLowerCase().includes(term) ||
        getPuestoNombre(row).toLowerCase().includes(term) ||
        getSucursalNombre(row).toLowerCase().includes(term) ||
        getEstadoLabel(row).toLowerCase().includes(term) ||
        (getEmpleadoUsuarioEmail(row) ?? "").toLowerCase().includes(term) ||
        (getEmpleadoUsuarioRole(row) ?? "").toLowerCase().includes(term);

      return (
        matchesDepartamento &&
        matchesSucursal &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    empleadosQuery.data,
    search,
    departamentoFilter,
    sucursalFilter,
    statusFilter,
  ]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    rows.sort((a, b) => {
      let result = 0;

      switch (sortField) {
        case "numEmpleado":
          result = compareSortText(a.numEmpleado, b.numEmpleado);
          break;
        case "nombre":
          result = compareSortText(getEmpleadoNombre(a), getEmpleadoNombre(b));
          break;

        case "puesto":
          result = compareSortText(getPuestoNombre(a), getPuestoNombre(b));
          break;
        case "sucursal":
          result = compareSortText(getSucursalNombre(a), getSucursalNombre(b));
          break;
        case "estatus":
          result = compareSortText(getEstadoLabel(a), getEstadoLabel(b));
          break;
        default:
          result = compareSortText(a.numEmpleado, b.numEmpleado);
          break;
      }

      if (result === 0) {
        result = compareSortText(a.numEmpleado, b.numEmpleado);
      }

      return sortDirection === "asc" ? result : -result;
    });

    return rows;
  }, [filteredRows, sortDirection, sortField]);

  const paginatedRows = useMemo<Empleado[]>(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, departamentoFilter, sucursalFilter, statusFilter, rowsPerPage]);

  const activeCount = useMemo(
    () =>
      filteredRows.filter(
        (row: Empleado) =>
          row.activo && row.estatusLaboralActual === "ACTIVO"
      ).length,
    [filteredRows]
  );

  const bajaCount = useMemo(
    () =>
      filteredRows.filter(
        (row: Empleado) =>
          row.estatusLaboralActual === "BAJA" || !row.activo
      ).length,
    [filteredRows]
  );

  const linkedAccountCount = useMemo(
    () => filteredRows.filter((row) => getEmpleadoTieneCuenta(row)).length,
    [filteredRows]
  );

  const withoutAccountCount = useMemo(
    () => filteredRows.filter((row) => !getEmpleadoTieneCuenta(row)).length,
    [filteredRows]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (departamentoFilter) count += 1;
    if (sucursalFilter) count += 1;
    if (statusFilter) count += 1;
    return count;
  }, [search, departamentoFilter, sucursalFilter, statusFilter]);

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Empleado) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const openExpediente = (row: Empleado) => {
    navigate(`/empleados/${row.id}/expediente`);
  };

  const openBajaDialog = (row: Empleado) => {
    setBajaTarget(row);
  };

  const openReingresoDialog = (row: Empleado) => {
    setReingresoTarget(row);
  };

  const openCreateAccountDialog = (row: Empleado) => {
    setCreateAccountTarget(row);
  };

  const openLinkAccountDialog = (row: Empleado) => {
    setLinkAccountTarget(row);
  };

  const handleImported = async (result: EmpleadoImportExecuteResult) => {
    setImportDialogOpen(false);
    await empleadosQuery.refetch();

    showSnackbar(
      result.insertedRows > 0
        ? `Importación completada. Insertados: ${result.insertedRows}.`
        : "La importación terminó sin registros insertados.",
      "success"
    );
  };

  async function handleDownloadFicha(row: Empleado) {
    try {
      setDownloadingFichaId(row.id);
      await exportEmpleadoFichaPdf(row.id);
      showSnackbar("Ficha PDF generada correctamente.", "success");
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo descargar la ficha del empleado.",
        "error"
      );
    } finally {
      setDownloadingFichaId(null);
    }
  }

  const canOpenDialog =
    canManageEmpleados &&
    departamentos.length > 0 &&
    puestos.length > 0 &&
    !departamentosQuery.isLoading &&
    !puestosQuery.isLoading &&
    !sucursalesQuery.isLoading;

  const loadingAny =
    empleadosQuery.isLoading ||
    departamentosQuery.isLoading ||
    puestosQuery.isLoading ||
    sucursalesQuery.isLoading;

  const isRefreshing =
    (empleadosQuery.isFetching ||
      departamentosQuery.isFetching ||
      puestosQuery.isFetching ||
      sucursalesQuery.isFetching) &&
    !loadingAny;

  const handleRefresh = () => {
    void empleadosQuery.refetch();
    void departamentosQuery.refetch();
    void puestosQuery.refetch();
    void sucursalesQuery.refetch();
  };

  const clearFilters = () => {
    setSearch("");
    setDepartamentoFilter("");
    setSucursalFilter("");
    setStatusFilter("");
  };

  async function handleExportXlsx() {
    try {
      setExportingXlsx(true);

      await exportEmpleadosXlsx({
        sucursalId: sucursalFilter ? Number(sucursalFilter) : null,
        departamentoId: departamentoFilter ? Number(departamentoFilter) : null,
        puestoId: null,
        activo:
          statusFilter === "ACTIVO"
            ? true
            : statusFilter === "BAJA"
            ? false
            : null,
        estatusLaboral:
          statusFilter === "ACTIVO" || statusFilter === "BAJA"
            ? statusFilter
            : null,
        fechaIngresoDesde: null,
        fechaIngresoHasta: null,
        search: search.trim() || null,
      });

      showSnackbar("Reporte Excel generado correctamente.", "success");
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo exportar el reporte en Excel.",
        "error"
      );
    } finally {
      setExportingXlsx(false);
    }
  }

  async function handleExportPdf() {
    try {
      setExportingPdf(true);

      await exportEmpleadosPdf({
        sucursalId: sucursalFilter ? Number(sucursalFilter) : null,
        departamentoId: departamentoFilter ? Number(departamentoFilter) : null,
        puestoId: null,
        activo:
          statusFilter === "ACTIVO"
            ? true
            : statusFilter === "BAJA"
            ? false
            : null,
        estatusLaboral:
          statusFilter === "ACTIVO" || statusFilter === "BAJA"
            ? statusFilter
            : null,
        fechaIngresoDesde: null,
        fechaIngresoHasta: null,
        search: search.trim() || null,
      });

      showSnackbar("Reporte PDF generado correctamente.", "success");
    } catch (error) {
      showSnackbar(
        getErrorMessage(error) || "No se pudo exportar el reporte en PDF.",
        "error"
      );
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <AppPage
      eyebrow="Recursos Humanos"
      title="Empleados"
      subtitle="Catálogo operativo del personal registrado, con relación a departamentos, puestos y sucursales."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={
              isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={
              loadingAny ||
              saveMutation.isPending ||
              bajaMutation.isPending ||
              reingresoMutation.isPending ||
              createAccountMutation.isPending ||
              linkAccountMutation.isPending ||
              exportingXlsx ||
              exportingPdf
            }
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            variant="outlined"
            startIcon={
              exportingXlsx ? (
                <CircularProgress size={18} />
              ) : (
                <TableViewRoundedIcon />
              )
            }
            onClick={handleExportXlsx}
            disabled={loadingAny || exportingXlsx || exportingPdf}
          >
            {exportingXlsx ? "Exportando Excel..." : "Exportar Excel"}
          </Button>

          <Button
            variant="outlined"
            startIcon={
              exportingPdf ? (
                <CircularProgress size={18} />
              ) : (
                <PictureAsPdfRoundedIcon />
              )
            }
            onClick={handleExportPdf}
            disabled={loadingAny || exportingXlsx || exportingPdf}
          >
            {exportingPdf ? "Exportando PDF..." : "Exportar PDF"}
          </Button>

          {canManageEmpleados && (
            <Button
              variant="outlined"
              startIcon={<UploadFileRoundedIcon />}
              onClick={() => setImportDialogOpen(true)}
              disabled={exportingXlsx || exportingPdf}
            >
              Importar Excel
            </Button>
          )}

          {canManageEmpleados && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              disabled={!canOpenDialog || exportingXlsx || exportingPdf}
            >
              Nuevo empleado
            </Button>
          )}
        </Stack>
      }
    >
      <HeroBanner
        eyebrow="Catálogo RH"
        title="Gestión de empleados"
        subtitle="Consulta general del personal, su asignación organizacional, su estatus operativo y el vínculo de cuenta de acceso."
        badge="RH"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {normalizedRoles.length > 0 ? (
              normalizedRoles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.18),
                    backgroundColor: alpha("#ffffff", 0.08),
                    fontWeight: 800,
                  }}
                />
              ))
            ) : (
              <Chip
                label="Sin roles detectados"
                size="small"
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.18),
                  backgroundColor: alpha("#ffffff", 0.08),
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        }
        aside={
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.78) }}>
              Resumen rápido
            </Typography>

            <Stack direction="row" spacing={2.5}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {filteredRows.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  visibles
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {linkedAccountCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  con cuenta
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {withoutAccountCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  sin cuenta
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              {canOpenDialog
                ? "Catálogos base disponibles para alta, edición y vinculación de cuentas."
                : canManageEmpleados
                ? "Faltan catálogos base para permitir nuevas altas."
                : "Consulta disponible según tu rol actual."}
            </Typography>
          </Stack>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(12, 1fr)",
          },
        }}
      >
        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Activos"
            value={activeCount}
            subtitle="Estatus laboral ACTIVO"
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            badge="RH"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Bajas"
            value={bajaCount}
            subtitle="Con estatus laboral BAJA"
            icon={<BlockRoundedIcon fontSize="small" />}
            badge="RH"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Con cuenta"
            value={linkedAccountCount}
            subtitle="Acceso ligado a empleado"
            icon={<ManageAccountsRoundedIcon fontSize="small" />}
            badge="RH"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Sin cuenta"
            value={withoutAccountCount}
            subtitle="Pendientes por crear o ligar"
            icon={<MarkEmailReadRoundedIcon fontSize="small" />}
            badge="RH"
          />
        </Box>
      </Box>

      <SectionCard
        title="Filtros"
        subtitle="Busca por empleado, correo, puesto, sucursal, estado laboral o estado de cuenta."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="outlined"
              color={activeFiltersCount > 0 ? "primary" : undefined}
              label={
                activeFiltersCount > 0
                  ? `${activeFiltersCount} filtro${
                      activeFiltersCount > 1 ? "s" : ""
                    } activo${activeFiltersCount > 1 ? "s" : ""}`
                  : "Sin filtros"
              }
            />
            <Button
              size="small"
              variant="outlined"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              Limpiar
            </Button>
          </Stack>
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(12, 1fr)",
            },
            gap: 2,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 5" } }}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="No. empleado, nombre, correo, cuenta ligada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
            <TextField
              select
              fullWidth
              label="Departamento"
              value={departamentoFilter}
              onChange={(e) => setDepartamentoFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {departamentos.map((dep) => (
                <MenuItem key={dep.id} value={dep.id}>
                  {dep.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <TextField
              select
              fullWidth
              label="Sucursal"
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {sucursales.map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <TextField
              select
              fullWidth
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EstadoFiltroEmpleado)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activos</MenuItem>
              <MenuItem value="BAJA">Bajas</MenuItem>
            </TextField>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Listado"
        subtitle="Consulta general del catálogo de empleados, su asignación actual y el estado de su cuenta."
        actions={
          <Chip
            label={`${paginatedRows.length} visibles de ${sortedRows.length}`}
            size="small"
            variant="outlined"
          />
        }
      >
        {loadingAny ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : empleadosQuery.isError ? (
          <Alert severity="error">
            No se pudo cargar el catálogo. {getErrorMessage(empleadosQuery.error)}
          </Alert>
        ) : departamentosQuery.isError ? (
          <Alert severity="error">
            No se pudo cargar el catálogo de departamentos.{" "}
            {getErrorMessage(departamentosQuery.error)}
          </Alert>
        ) : puestosQuery.isError ? (
          <Alert severity="error">
            No se pudo cargar el catálogo de puestos.{" "}
            {getErrorMessage(puestosQuery.error)}
          </Alert>
        ) : sucursalesQuery.isError ? (
          <Alert severity="error">
            No se pudo cargar el catálogo de sucursales.{" "}
            {getErrorMessage(sucursalesQuery.error)}
          </Alert>
        ) : sortedRows.length === 0 ? (
          <EmptyState
            icon={<Groups2OutlinedIcon sx={{ fontSize: 52 }} />}
            title="No hay empleados para mostrar"
            description="No se encontraron registros con los filtros actuales. Ajusta la búsqueda o registra un nuevo empleado."
            actionLabel={canManageEmpleados ? "Nuevo empleado" : undefined}
            onAction={canManageEmpleados ? openCreateDialog : undefined}
          />
        ) : (
          <>
            <TableContainer
              sx={{
                border: `1px solid ${alpha("#0f172a", 0.06)}`,
                borderRadius: 3,
                overflowX: "auto",
                maxHeight: 620,
              }}
            >
              <Table stickyHeader size="small" sx={{ minWidth: 1000 }}>
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      backgroundColor: "#f4f7fc",
                      zIndex: 2,
                      fontWeight: 800,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ width: 116 }}>
                      <TableSortLabel
                        active={sortField === "numEmpleado"}
                        direction={sortField === "numEmpleado" ? sortDirection : "asc"}
                        onClick={() => handleSort("numEmpleado")}
                      >
                        Num.
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ minWidth: 280 }}>
                      <TableSortLabel
                        active={sortField === "nombre"}
                        direction={sortField === "nombre" ? sortDirection : "asc"}
                        onClick={() => handleSort("nombre")}
                      >
                        Empleado
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ minWidth: 220 }}>
                      <TableSortLabel
                        active={sortField === "puesto"}
                        direction={sortField === "puesto" ? sortDirection : "asc"}
                        onClick={() => handleSort("puesto")}
                      >
                        Puesto
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ minWidth: 190 }}>
                      <TableSortLabel
                        active={sortField === "sucursal"}
                        direction={sortField === "sucursal" ? sortDirection : "asc"}
                        onClick={() => handleSort("sucursal")}
                      >
                        Sucursal
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ width: 132 }}>
                      <TableSortLabel
                        active={sortField === "estatus"}
                        direction={sortField === "estatus" ? sortDirection : "asc"}
                        onClick={() => handleSort("estatus")}
                      >
                        Estatus
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ minWidth: 220 }}>
                      Cuenta
                    </TableCell>

                    <TableCell align="right" sx={{ width: 250 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.map((row: Empleado) => {
                    const isActivo =
                      row.activo && row.estatusLaboralActual === "ACTIVO";
                    const hasAccount = getEmpleadoTieneCuenta(row);
                    const hasEmail = Boolean(row.email?.trim());

                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          backgroundColor: isActivo
                            ? "transparent"
                            : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={800}>{row.numEmpleado}</Typography>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: `1px solid ${alpha("#0f172a", 0.08)}`,
                                backgroundColor: alpha("#0f172a", 0.04),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {row.tieneFoto && resolveEmpleadoPhotoUrl(row.fotoUrl) ? (
                                <Box
                                  component="img"
                                  src={resolveEmpleadoPhotoUrl(row.fotoUrl) ?? undefined}
                                  alt={getEmpleadoNombre(row)}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <BadgeOutlinedIcon
                                  sx={{ fontSize: 18, color: "text.secondary" }}
                                />
                              )}
                            </Box>

                            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                              <Tooltip title={getEmpleadoNombre(row)} arrow>
                                <Typography
                                  fontWeight={800}
                                  sx={{ ...tableCellTruncateSx, maxWidth: 240 }}
                                >
                                  {getEmpleadoNombre(row)}
                                </Typography>
                              </Tooltip>

                              <Tooltip title={row.email || "Sin correo"} arrow>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ...tableCellTruncateSx, maxWidth: 240 }}
                                >
                                  {row.email || "Sin correo"}
                                </Typography>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Tooltip title={getPuestoNombre(row)} arrow>
                            <Typography sx={{ ...tableCellTruncateSx, maxWidth: 210 }}>
                              {getPuestoNombre(row)}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Tooltip title={getSucursalNombre(row)} arrow>
                            <Typography sx={{ ...tableCellTruncateSx, maxWidth: 180 }}>
                              {getSucursalNombre(row)}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.35} alignItems="flex-start" sx={{ minWidth: 0 }}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={getEstadoLabel(row)}
                              sx={empleadoStatusChipSx(
                                row.estatusLaboralActual,
                                row.activo
                              )}
                            />

                            {row.estatusLaboralActual === "BAJA" && row.fechaBajaActual ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ...tableCellTruncateSx, maxWidth: 110 }}
                              >
                                Baja: {formatDate(row.fechaBajaActual)}
                              </Typography>
                            ) : row.fechaReingresoActual ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ...tableCellTruncateSx, maxWidth: 110 }}
                              >
                                Reingreso: {formatDate(row.fechaReingresoActual)}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.35} alignItems="flex-start" sx={{ minWidth: 0 }}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                hasAccount
                                  ? "Cuenta ligada"
                                  : hasEmail
                                  ? "Sin cuenta"
                                  : "Sin correo"
                              }
                              sx={cuentaStatusChipSx(hasAccount, hasEmail)}
                            />

                            {hasAccount ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ...tableCellTruncateSx, maxWidth: 200 }}
                              >
                                {getEmpleadoUsuarioRole(row) || "Rol"} ·{" "}
                                {getEmpleadoUsuarioEmail(row) || "Sin correo"}
                              </Typography>
                            ) : hasEmail ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ...tableCellTruncateSx, maxWidth: 200 }}
                              >
                                Listo para crear o vincular por email
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ...tableCellTruncateSx, maxWidth: 200 }}
                              >
                                Captura correo antes de vincular
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Box sx={tableActionGridSx}>
                            <Tooltip title="Descargar ficha">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => void handleDownloadFicha(row)}
                                  disabled={downloadingFichaId === row.id}
                                  sx={actionIconButtonSx("pdf")}
                                >
                                  {downloadingFichaId === row.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <PictureAsPdfRoundedIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Expediente">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => openExpediente(row)}
                                  sx={actionIconButtonSx("view")}
                                >
                                  <FolderOpenRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {canManageEmpleados && !hasAccount ? (
                              <Tooltip title="Crear cuenta">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => openCreateAccountDialog(row)}
                                    disabled={createAccountMutation.isPending}
                                    sx={actionIconButtonSx("createAccount")}
                                  >
                                    <ManageAccountsRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Box />
                            )}

                            {canManageEmpleados && !hasAccount ? (
                              <Tooltip
                                title={
                                  hasEmail
                                    ? "Vincular usuario por email"
                                    : "El empleado no tiene correo"
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => openLinkAccountDialog(row)}
                                    disabled={linkAccountMutation.isPending || !hasEmail}
                                    sx={actionIconButtonSx("linkAccount")}
                                  >
                                    <LinkRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Box />
                            )}

                            {canManageEmpleados ? (
                              <Tooltip title="Editar">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => openEditDialog(row)}
                                    sx={actionIconButtonSx("edit")}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Box />
                            )}

                            {canManageEmpleados && isActivo ? (
                              <Tooltip title="Dar baja">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => openBajaDialog(row)}
                                    sx={actionIconButtonSx("baja")}
                                  >
                                    <PersonOffRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : canManageEmpleados &&
                              row.estatusLaboralActual === "BAJA" ? (
                              <Tooltip title="Reingresar">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => openReingresoDialog(row)}
                                    sx={actionIconButtonSx("reingreso")}
                                  >
                                    <PersonAddAlt1RoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Box />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={sortedRows.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(
                e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${
                  count !== -1 ? count : `más de ${to}`
                }`
              }
            />
          </>
        )}
      </SectionCard>

      <EmpleadoDialog
        open={dialogOpen}
        onClose={() => {
          if (saveMutation.isPending) return;
          setDialogOpen(false);
          setEditing(null);
        }}
        initialValues={editing}
        saving={saveMutation.isPending}
        departamentos={departamentos}
        puestos={puestos}
        sucursales={sucursales}
        onSubmit={async (values, photoFile) => {
          await saveMutation.mutateAsync({ values, photoFile });
        }}
      />

      <EmpleadoImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImported={handleImported}
      />

      <BajaEmpleadoDialog
        open={!!bajaTarget}
        empleado={bajaTarget}
        saving={bajaMutation.isPending}
        onClose={() => {
          if (bajaMutation.isPending) return;
          setBajaTarget(null);
        }}
        onSubmit={async (payload) => {
          if (!bajaTarget) return;
          await bajaMutation.mutateAsync({
            empleado: bajaTarget,
            payload,
          });
        }}
      />

      <ReingresoEmpleadoDialog
        open={!!reingresoTarget}
        empleado={reingresoTarget}
        saving={reingresoMutation.isPending}
        onClose={() => {
          if (reingresoMutation.isPending) return;
          setReingresoTarget(null);
        }}
        onSubmit={async (payload) => {
          if (!reingresoTarget) return;
          await reingresoMutation.mutateAsync({
            empleado: reingresoTarget,
            payload,
          });
        }}
        departamentos={departamentos}
        puestos={puestos}
        sucursales={sucursales}
      />

      <CreateAccountDialog
        open={!!createAccountTarget}
        empleado={createAccountTarget}
        saving={createAccountMutation.isPending}
        onClose={() => {
          if (createAccountMutation.isPending) return;
          setCreateAccountTarget(null);
        }}
        onSubmit={async (payload) => {
          if (!createAccountTarget) return;
          await createAccountMutation.mutateAsync({
            empleado: createAccountTarget,
            payload,
          });
        }}
      />

      <LinkUserByEmailDialog
        open={!!linkAccountTarget}
        empleado={linkAccountTarget}
        saving={linkAccountMutation.isPending}
        onClose={() => {
          if (linkAccountMutation.isPending) return;
          setLinkAccountTarget(null);
        }}
        onSubmit={async () => {
          if (!linkAccountTarget) return;
          await linkAccountMutation.mutateAsync(linkAccountTarget);
        }}
      />
    </AppPage>
  );
}