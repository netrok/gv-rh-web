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
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import {
  cambiarNumeroEmpleado,
  createEmpleado,
  darBajaEmpleado,
  deleteEmpleadoPhoto,
  exportEmpleadoFichaPdf,
  exportEmpleadosPdf,
  exportEmpleadosXlsx,
  getEmpleadoMovimientos,
  getEmpleados,
  getSiguienteNumeroEmpleadoSugerido,
  reingresarEmpleado,
  updateEmpleado,
  uploadEmpleadoPhoto,
  type DarBajaEmpleadoInput,
  type Empleado,
  type EmpleadoCreateInput,
  type EmpleadoMovimientoLaboral,
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
  // Generales
  numEmpleado: z
    .string()
    .trim()
    .min(1, "El número de empleado es obligatorio")
    .max(30, "Máximo 30 caracteres"),

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

  // Identificación
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

  // Domicilio
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

  // Fiscales
  codigoPostalFiscal: z
    .string()
    .trim()
    .max(5, "Máximo 5 caracteres")
    .refine((value) => value === "" || /^\d{5}$/.test(value), {
      message: "El código postal fiscal debe contener exactamente 5 dígitos",
    }),

  entidadFiscal: z.string().trim().max(120, "Máximo 120 caracteres"),

  // Emergencia
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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

function departmentChipSx() {
  return {
    width: "fit-content",
    borderRadius: "999px",
    fontWeight: 800,
    borderColor: alpha("#2563eb", 0.24),
    color: "#1d4ed8",
    backgroundColor: alpha("#2563eb", 0.04),
    "& .MuiChip-icon": {
      color: "#2563eb",
    },
  } as const;
}

function empleadoStatusChipSx(
  estatus: Empleado["estatusLaboralActual"],
  activo: boolean
) {
  const isActivo = estatus === "ACTIVO" && activo;

  return {
    fontWeight: 800,
    borderRadius: "999px",
    color: isActivo ? "#166534" : "#991b1b",
    borderColor: isActivo
      ? alpha("#16a34a", 0.22)
      : alpha("#dc2626", 0.22),
    backgroundColor: isActivo
      ? alpha("#16a34a", 0.05)
      : alpha("#dc2626", 0.05),
  } as const;
}

function actionIconButtonSx(
  variant: "view" | "edit" | "baja" | "reingreso" | "history" | "pdf"
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
    history: {
      color: "#4338ca",
      border: alpha("#4338ca", 0.18),
      bg: alpha("#4338ca", 0.05),
      hover: alpha("#4338ca", 0.1),
    },
    pdf: {
      color: "#b91c1c",
      border: alpha("#b91c1c", 0.18),
      bg: alpha("#b91c1c", 0.05),
      hover: alpha("#b91c1c", 0.1),
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

function getMovimientoLabel(tipo: EmpleadoMovimientoLaboral["tipoMovimiento"]) {
  switch (tipo) {
    case "ALTA":
      return "Alta";
    case "BAJA":
      return "Baja";
    case "REINGRESO":
      return "Reingreso";
    case "CAMBIO_PUESTO":
      return "Cambio de puesto";
    case "CAMBIO_DEPARTAMENTO":
      return "Cambio de departamento";
    case "CAMBIO_SUCURSAL":
      return "Cambio de sucursal";
    case "CAMBIO_SALARIO":
      return "Cambio de salario";
    default:
      return tipo;
  }
}

function getTipoBajaLabel(tipo?: TipoBajaEmpleado | null) {
  const found = TIPOS_BAJA.find((item) => item.value === tipo);
  return found?.label ?? tipo ?? "-";
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

    setPhotoUrl(initialValues?.fotoUrl ?? null);
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
  const activo = !!watch("activo");
  const numEmpleado = watch("numEmpleado");

  const effectivePhotoUrl = localPhotoPreviewUrl || photoUrl;

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
        setPhotoUrl(result.fotoUrl ?? null);
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
    await onSubmit(
      {
        numEmpleado: normalizeNumEmpleadoInput(values.numEmpleado),
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
                      : "Clave operativa definida por RH.")
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

function MovimientosDialog({
  open,
  empleado,
  onClose,
}: {
  open: boolean;
  empleado: Empleado | null;
  onClose: () => void;
}) {
  const movimientosQuery = useQuery<EmpleadoMovimientoLaboral[], Error>({
    queryKey: ["empleados", "movimientos", empleado?.id],
    queryFn: () => getEmpleadoMovimientos(Number(empleado?.id)),
    enabled: open && !!empleado?.id,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Historial laboral</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography fontWeight={800}>
              {empleado ? getEmpleadoNombre(empleado) : "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empleado?.numEmpleado ?? "-"}
            </Typography>
          </Box>

          {movimientosQuery.isLoading ? (
            <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : movimientosQuery.isError ? (
            <Alert severity="error">
              No se pudo cargar el historial. {getErrorMessage(movimientosQuery.error)}
            </Alert>
          ) : (movimientosQuery.data ?? []).length === 0 ? (
            <Alert severity="info">
              Este empleado aún no tiene movimientos laborales registrados.
            </Alert>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Movimiento</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo baja</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Comentario</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Registro</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(movimientosQuery.data ?? []).map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getMovimientoLabel(item.tipoMovimiento)}
                          color={
                            item.tipoMovimiento === "BAJA"
                              ? "warning"
                              : item.tipoMovimiento === "REINGRESO"
                                ? "success"
                                : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.fechaMovimiento)}</TableCell>
                      <TableCell>
                        {getTipoBajaLabel(
                          item.tipoBaja as TipoBajaEmpleado | null
                        )}
                      </TableCell>
                      <TableCell>{item.motivo || "-"}</TableCell>
                      <TableCell>{item.comentario || "-"}</TableCell>
                      <TableCell>{item.usuarioResponsableId ?? "-"}</TableCell>
                      <TableCell>{formatDateTime(item.createdAtUtc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
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
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [bajaTarget, setBajaTarget] = useState<Empleado | null>(null);
  const [reingresoTarget, setReingresoTarget] = useState<Empleado | null>(
    null
  );
  const [movimientosTarget, setMovimientosTarget] = useState<Empleado | null>(
    null
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingFichaId, setDownloadingFichaId] = useState<number | null>(
    null
  );

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const canManageEmpleados = hasSomeRole(roles, ["ADMIN", "RRHH"]);

  const empleadosQuery = useQuery<Empleado[], Error>({
    queryKey: ["empleados"],
    queryFn: async () => {
      const data = await getEmpleados({
        page: 1,
        pageSize: 500,
        sort: "id",
        dir: "desc",
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
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      void queryClient.invalidateQueries({
        queryKey: ["empleados", "movimientos", vars.empleado.id],
      });
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
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });
      void queryClient.invalidateQueries({
        queryKey: ["empleados", "movimientos", vars.empleado.id],
      });
      setReingresoTarget(null);
      showSnackbar("Reingreso registrado correctamente.", "success");
    },
    onError: (error) => {
      showSnackbar(getErrorMessage(error), "error");
    },
  });

  const filteredRows = useMemo<Empleado[]>(() => {
    const rows = empleadosQuery.data ?? [];
    const term = search.trim().toLowerCase();

    return rows.filter((row: Empleado) => {
      const departamento = row.departamentoId
        ? departamentosMap.get(Number(row.departamentoId))
        : undefined;
      const puesto = row.puestoId
        ? puestosMap.get(Number(row.puestoId))
        : undefined;
      const sucursal = row.sucursalId
        ? sucursalesMap.get(Number(row.sucursalId))
        : undefined;

      const matchesDepartamento =
        !departamentoFilter ||
        String(row.departamentoId ?? "") === String(departamentoFilter);

      const matchesSucursal =
        !sucursalFilter ||
        String(row.sucursalId ?? "") === String(sucursalFilter);

      const matchesStatus =
        !statusFilter ||
        row.estatusLaboralActual === statusFilter ||
        (statusFilter === "INACTIVO" && !row.activo);

      const matchesSearch =
        !term ||
        String(row.id).includes(term) ||
        (row.numEmpleado ?? "").toLowerCase().includes(term) ||
        (row.nombres ?? "").toLowerCase().includes(term) ||
        (row.apellidoPaterno ?? "").toLowerCase().includes(term) ||
        (row.apellidoMaterno ?? "").toLowerCase().includes(term) ||
        (row.email ?? "").toLowerCase().includes(term) ||
        (row.curp ?? "").toLowerCase().includes(term) ||
        (row.rfc ?? "").toLowerCase().includes(term) ||
        (row.nss ?? "").toLowerCase().includes(term) ||
        (departamento?.nombre ?? "").toLowerCase().includes(term) ||
        (departamento?.clave ?? "").toLowerCase().includes(term) ||
        (puesto?.nombre ?? "").toLowerCase().includes(term) ||
        (puesto?.clave ?? "").toLowerCase().includes(term) ||
        (sucursal?.nombre ?? "").toLowerCase().includes(term) ||
        (sucursal?.clave ?? "").toLowerCase().includes(term) ||
        (row.estatusLaboralActual ?? "").toLowerCase().includes(term) ||
        (row.activo ? "activo" : "inactivo").includes(term);

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
    departamentosMap,
    puestosMap,
    sucursalesMap,
  ]);

  const paginatedRows = useMemo<Empleado[]>(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [
    search,
    departamentoFilter,
    sucursalFilter,
    statusFilter,
    filteredRows.length,
  ]);

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

  const assignedBranchCount = useMemo(() => {
    return new Set(
      filteredRows
        .map((row: Empleado) => row.sucursalId)
        .filter((value): value is number => Number(value) > 0)
    ).size;
  }, [filteredRows]);

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

  const openMovimientosDialog = (row: Empleado) => {
    setMovimientosTarget(row);
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
            : statusFilter === "INACTIVO"
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
            : statusFilter === "INACTIVO"
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
        subtitle="Consulta general del personal, su asignación organizacional y su estado operativo actual dentro del sistema."
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
                  {activeCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  activos
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {activeFiltersCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#ffffff", 0.8) }}
                >
                  filtros
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.84) }}>
              {canOpenDialog
                ? "Catálogos base disponibles para alta y edición."
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
            title="Sucursales"
            value={assignedBranchCount}
            subtitle="Con personal asignado"
            icon={<StoreRoundedIcon fontSize="small" />}
            badge="RH"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
          <MetricCard
            title="Visibles"
            value={filteredRows.length}
            subtitle="Empleados visibles"
            icon={<Groups2OutlinedIcon fontSize="small" />}
            badge="RH"
          />
        </Box>
      </Box>

      <SectionCard
        title="Filtros"
        subtitle="Busca por empleado, correo, puesto, sucursal o estatus."
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
              placeholder="No. empleado, nombre, correo, CURP, RFC, NSS..."
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
                  {dep.clave} - {dep.nombre}
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
                  {sucursal.clave} - {sucursal.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <TextField
              select
              fullWidth
              label="Estatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activos</MenuItem>
              <MenuItem value="BAJA">Bajas</MenuItem>
              <MenuItem value="INACTIVO">Inactivos</MenuItem>
            </TextField>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Listado"
        subtitle="Consulta general del catálogo de empleados y su asignación actual."
        actions={
          <Chip
            label={`${paginatedRows.length} visibles de ${filteredRows.length}`}
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
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon={<Groups2OutlinedIcon sx={{ fontSize: 52 }} />}
            title="No hay empleados para mostrar"
            description="No se encontraron registros con los filtros actuales. Ajusta la búsqueda o registra un nuevo empleado."
            actionLabel={canManageEmpleados ? "Nuevo empleado" : undefined}
            onAction={canManageEmpleados ? openCreateDialog : undefined}
          />
        ) : (
          <>
            <Box sx={{ overflowX: "auto", maxHeight: 620 }}>
              <Table stickyHeader size="small">
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      backgroundColor: "#f4f7fc",
                      zIndex: 2,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>No. Empleado</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Puesto</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Ingreso</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.map((row: Empleado) => {
                    const departamento = row.departamentoId
                      ? departamentosMap.get(Number(row.departamentoId))
                      : undefined;
                    const puesto = row.puestoId
                      ? puestosMap.get(Number(row.puestoId))
                      : undefined;
                    const sucursal = row.sucursalId
                      ? sucursalesMap.get(Number(row.sucursalId))
                      : undefined;

                    const isActivo =
                      row.activo && row.estatusLaboralActual === "ACTIVO";

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
                        <TableCell>{row.id}</TableCell>

                        <TableCell>
                          <Typography fontWeight={700}>
                            {row.numEmpleado}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
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
                              {row.tieneFoto && row.fotoUrl ? (
                                <Box
                                  component="img"
                                  src={row.fotoUrl}
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
                              <Typography fontWeight={700}>
                                {getEmpleadoNombre(row)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  maxWidth: 240,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {row.email || "Sin correo"}
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          {departamento ? (
                            <Tooltip
                              arrow
                              title={`${departamento.clave} - ${departamento.nombre}`}
                            >
                              <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  icon={<ApartmentOutlinedIcon />}
                                  label={departamento.clave}
                                  sx={departmentChipSx()}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "block",
                                    maxWidth: 180,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {departamento.nombre}
                                </Typography>
                              </Stack>
                            </Tooltip>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell>
                          {puesto ? `${puesto.clave} - ${puesto.nombre}` : "-"}
                        </TableCell>

                        <TableCell>
                          {sucursal
                            ? `${sucursal.clave} - ${sucursal.nombre}`
                            : row.sucursalNombre ?? "-"}
                        </TableCell>

                        <TableCell>{formatDate(row.fechaIngreso)}</TableCell>

                        <TableCell>
                          <Stack spacing={0.4}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                row.estatusLaboralActual === "ACTIVO"
                                  ? "Activo"
                                  : "Baja"
                              }
                              sx={empleadoStatusChipSx(
                                row.estatusLaboralActual,
                                row.activo
                              )}
                            />

                            {row.estatusLaboralActual === "BAJA" &&
                            row.fechaBajaActual ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Baja: {formatDate(row.fechaBajaActual)}
                              </Typography>
                            ) : row.fechaReingresoActual ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Reingreso: {formatDate(row.fechaReingresoActual)}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            justifyContent="flex-end"
                            flexWrap="wrap"
                            useFlexGap
                          >
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

                            <Tooltip title="Historial laboral">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => openMovimientosDialog(row)}
                                  sx={actionIconButtonSx("history")}
                                >
                                  <HistoryRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {canManageEmpleados && (
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
                            )}

                            {canManageEmpleados && isActivo && (
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
                            )}

                            {canManageEmpleados &&
                              row.estatusLaboralActual === "BAJA" && (
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
                              )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={filteredRows.length}
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

      <MovimientosDialog
        open={!!movimientosTarget}
        empleado={movimientosTarget}
        onClose={() => setMovimientosTarget(null)}
      />
    </AppPage>
  );
}