import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useAuth } from "../../features/auth/AuthContext";

const DRAWER_WIDTH = 260;

type AppShellProps = {
  children?: ReactNode;
};

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  allow?: string[];
};

type NavEntry =
  | {
      type: "item";
      item: NavItem;
    }
  | {
      type: "recruitment";
      allow?: string[];
    }
  | {
      type: "vacations";
      allow?: string[];
    };

type NavSection = {
  title: string;
  entries: NavEntry[];
};

function normalizeRoles(roles?: string[] | null) {
  return [
    ...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function hasSomeRole(roles?: string[] | null, allowed?: string[]) {
  if (!allowed || allowed.length === 0) return true;

  const current = normalizeRoles(roles);
  return allowed.some((role) => current.includes(role.toUpperCase()));
}

function getDisplayName(user: any) {
  return (
    user?.name ??
    user?.nombre ??
    user?.fullName ??
    user?.displayName ??
    user?.email?.split("@")?.[0] ??
    "Usuario"
  );
}

function getDisplayEmail(user: any) {
  return user?.email ?? user?.correo ?? "";
}

function getInitials(text: string) {
  const clean = text.trim();

  if (!clean) return "U";

  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function buildNavSections(roles?: string[] | null): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "Principal",
      entries: [
        {
          type: "item",
          item: {
            label: "Dashboard",
            to: "/dashboard",
            icon: <DashboardRoundedIcon />,
            allow: ["ADMIN", "RRHH", "JEFE", "CONSULTA", "EMPLEADO"],
          },
        },
      ],
    },
    {
      title: "Operación",
      entries: [
        {
          type: "item",
          item: {
            label: "Auditoría",
            to: "/audit",
            icon: <FactCheckRoundedIcon />,
            allow: ["ADMIN", "RRHH"],
          },
        },
        {
          type: "item",
          item: {
            label: "Empleados",
            to: "/empleados",
            icon: <Groups2RoundedIcon />,
            allow: ["ADMIN", "RRHH", "JEFE", "CONSULTA"],
          },
        },
        {
          type: "item",
          item: {
            label: "Incidencias",
            to: "/incidencias",
            icon: <EventBusyRoundedIcon />,
            allow: ["ADMIN", "RRHH", "JEFE", "EMPLEADO"],
          },
        },
        {
          type: "item",
          item: {
            label: "Cumpleaños",
            to: "/cumpleanios",
            icon: <CelebrationRoundedIcon />,
            allow: ["ADMIN", "RRHH", "JEFE", "CONSULTA", "EMPLEADO"],
          },
        },
        {
          type: "vacations",
          allow: ["ADMIN", "RRHH"],
        },
        {
          type: "recruitment",
          allow: ["ADMIN", "RRHH"],
        },
      ],
    },
    {
      title: "Catálogos",
      entries: [
        {
          type: "item",
          item: {
            label: "Departamentos",
            to: "/departamentos",
            icon: <ApartmentRoundedIcon />,
            allow: ["ADMIN", "RRHH"],
          },
        },
        {
          type: "item",
          item: {
            label: "Puestos",
            to: "/puestos",
            icon: <BadgeRoundedIcon />,
            allow: ["ADMIN", "RRHH"],
          },
        },
        {
          type: "item",
          item: {
            label: "Sucursales",
            to: "/sucursales",
            icon: <StoreRoundedIcon />,
            allow: ["ADMIN", "RRHH"],
          },
        },
      ],
    },
    {
      title: "Seguridad",
      entries: [
        {
          type: "item",
          item: {
            label: "Usuarios",
            to: "/usuarios",
            icon: <PeopleAltRoundedIcon />,
            allow: ["ADMIN"],
          },
        },
      ],
    },
  ];

  return sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => {
        if (entry.type === "item") {
          return hasSomeRole(roles, entry.item.allow);
        }

        return hasSomeRole(roles, entry.allow ?? []);
      }),
    }))
    .filter((section) => section.entries.length > 0);
}

function isRouteActive(pathname: string, to: string) {
  if (to === "/dashboard") return pathname === "/dashboard";

  return pathname === to || pathname.startsWith(`${to}/`);
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/audit")) return "Auditoría";
  if (pathname.startsWith("/cumpleanios")) return "Cumpleaños";
  if (pathname.startsWith("/departamentos")) return "Departamentos";
  if (pathname.startsWith("/empleados")) return "Empleados";
  if (pathname.startsWith("/incidencias")) return "Incidencias";
  if (pathname.startsWith("/puestos")) return "Puestos";

  if (pathname.startsWith("/vacaciones/reportes/kardex")) {
    return "Reporte de kárdex";
  }

  if (pathname.startsWith("/vacaciones/reportes/saldos")) {
    return "Reporte de saldos";
  }

  if (pathname.startsWith("/vacaciones/conciliacion")) {
    return "Validar Excel";
  }

  if (pathname.startsWith("/vacaciones/importacion")) {
    return "Importar saldos";
  }

  if (pathname === "/reclutamiento") return "Resumen ejecutivo";
  if (pathname.startsWith("/reclutamiento/candidatos")) return "Candidatos";
  if (pathname.startsWith("/reclutamiento/vacantes")) return "Vacantes";
  if (pathname.startsWith("/reclutamiento")) return "Reclutamiento";
  if (pathname.startsWith("/sucursales")) return "Sucursales";
  if (pathname.startsWith("/usuarios")) return "Usuarios";

  return "GV RH";
}

function getPageSubtitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Vista general del sistema";
  if (pathname.startsWith("/audit")) return "Trazabilidad y control de movimientos";

  if (pathname.startsWith("/cumpleanios")) {
    return "Celebraciones y próximos cumpleaños del personal";
  }

  if (pathname.startsWith("/departamentos")) return "Estructura organizacional";
  if (pathname.startsWith("/empleados")) return "Gestión integral del personal";

  if (pathname.startsWith("/incidencias")) {
    return "Control administrativo de incidencias";
  }

  if (pathname.startsWith("/puestos")) return "Catálogo de puestos y jerarquías";

  if (pathname.startsWith("/vacaciones/reportes/kardex")) {
    return "Auditoría de movimientos, saldos y origen";
  }

  if (pathname.startsWith("/vacaciones/reportes/saldos")) {
    return "Saldos disponibles, vencidos y acumulados";
  }

  if (pathname.startsWith("/vacaciones/conciliacion")) {
    return "Cruce previo de empleados contra GV RH";
  }

  if (pathname.startsWith("/vacaciones/importacion")) {
    return "Confirmación controlada de saldos iniciales";
  }

  if (pathname === "/reclutamiento") {
    return "Vista ejecutiva del módulo de reclutamiento";
  }

  if (pathname.startsWith("/reclutamiento/candidatos")) {
    return "Banco de talento y gestión de perfiles";
  }

  if (pathname.startsWith("/reclutamiento/vacantes")) {
    return "Vacantes y posiciones abiertas";
  }

  if (pathname.startsWith("/reclutamiento")) {
    return "Atracción y seguimiento de talento";
  }

  if (pathname.startsWith("/sucursales")) {
    return "Catálogo y operación de sucursales";
  }

  if (pathname.startsWith("/usuarios")) {
    return "Administración de accesos y cuentas";
  }

  return "Recursos Humanos";
}

function getPageBreadcrumb(pathname: string) {
  if (pathname.startsWith("/vacaciones/reportes/kardex")) {
    return ["Vacaciones", "Reporte de kárdex"];
  }

  if (pathname.startsWith("/vacaciones/reportes/saldos")) {
    return ["Vacaciones", "Reporte de saldos"];
  }

  if (pathname.startsWith("/vacaciones/conciliacion")) {
    return ["Vacaciones", "Validación"];
  }

  if (pathname.startsWith("/vacaciones/importacion")) {
    return ["Vacaciones", "Importación"];
  }

  if (pathname === "/reclutamiento") {
    return ["Reclutamiento", "Resumen"];
  }

  if (pathname.startsWith("/reclutamiento/candidatos")) {
    return ["Reclutamiento", "Candidatos"];
  }

  if (pathname.startsWith("/reclutamiento/vacantes")) {
    return ["Reclutamiento", "Vacantes"];
  }

  if (pathname.startsWith("/reclutamiento")) {
    return ["Reclutamiento"];
  }

  if (pathname.startsWith("/audit")) return ["Auditoría"];
  if (pathname.startsWith("/cumpleanios")) return ["Cumpleaños"];
  if (pathname.startsWith("/departamentos")) return ["Departamentos"];
  if (pathname.startsWith("/empleados")) return ["Empleados"];
  if (pathname.startsWith("/incidencias")) return ["Incidencias"];
  if (pathname.startsWith("/puestos")) return ["Puestos"];
  if (pathname.startsWith("/sucursales")) return ["Sucursales"];
  if (pathname.startsWith("/usuarios")) return ["Usuarios"];
  if (pathname.startsWith("/dashboard")) return ["Dashboard"];

  return ["GV RH"];
}

function getPageHeaderMeta(pathname: string): {
  label: string;
  icon: ReactElement;
} {
  if (pathname.startsWith("/dashboard")) {
    return {
      label: "Dashboard",
      icon: <DashboardRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/audit")) {
    return {
      label: "Auditoría",
      icon: <FactCheckRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/cumpleanios")) {
    return {
      label: "Cumpleaños",
      icon: <CelebrationRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/departamentos")) {
    return {
      label: "Departamentos",
      icon: <ApartmentRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/empleados")) {
    return {
      label: "Empleados",
      icon: <Groups2RoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/incidencias")) {
    return {
      label: "Incidencias",
      icon: <EventBusyRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/puestos")) {
    return {
      label: "Puestos",
      icon: <BadgeRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/vacaciones")) {
    return {
      label: "Vacaciones",
      icon: <UploadFileRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/reclutamiento")) {
    return {
      label: "Reclutamiento",
      icon: <BusinessCenterRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/sucursales")) {
    return {
      label: "Sucursales",
      icon: <StoreRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  if (pathname.startsWith("/usuarios")) {
    return {
      label: "Usuarios",
      icon: <PeopleAltRoundedIcon sx={{ fontSize: 16 }} />,
    };
  }

  return {
    label: "GV RH",
    icon: <ShieldRoundedIcon sx={{ fontSize: 16 }} />,
  };
}

function normalizeHeaderText(value: string) {
  return value.trim().toUpperCase();
}

function shouldShowBreadcrumb(breadcrumb: string[], pageTitle: string) {
  if (breadcrumb.length === 0) return false;
  if (breadcrumb.length > 1) return true;

  return normalizeHeaderText(breadcrumb[0]) !== normalizeHeaderText(pageTitle);
}

function shouldShowHeaderMeta(
  pathname: string,
  breadcrumb: string[],
  pageTitle: string
) {
  if (pathname === "/dashboard") return false;

  return shouldShowBreadcrumb(breadcrumb, pageTitle);
}

function SidebarContent({
  pathname,
  roles,
  displayName,
  displayEmail,
  initials,
  isDesktop,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  roles?: string[] | null;
  displayName: string;
  displayEmail: string;
  initials: string;
  isDesktop: boolean;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const navSections = buildNavSections(roles);
  const primaryRole = normalizeRoles(roles)[0] ?? "USUARIO";

  const isRecruitmentRoute = pathname.startsWith("/reclutamiento");
  const isResumenRoute = pathname === "/reclutamiento";
  const isCandidatosRoute = pathname.startsWith("/reclutamiento/candidatos");
  const isVacantesRoute = pathname.startsWith("/reclutamiento/vacantes");

  const isVacationsRoute = pathname.startsWith("/vacaciones");
  const isVacacionesConciliacionRoute = pathname.startsWith(
    "/vacaciones/conciliacion"
  );
  const isVacacionesImportacionRoute = pathname.startsWith(
    "/vacaciones/importacion"
  );
  const isVacacionesSaldosRoute = pathname.startsWith(
    "/vacaciones/reportes/saldos"
  );
  const isVacacionesKardexRoute = pathname.startsWith(
    "/vacaciones/reportes/kardex"
  );

  const [reclutamientoOpen, setReclutamientoOpen] =
    useState(isRecruitmentRoute);
  const [vacacionesOpen, setVacacionesOpen] = useState(isVacationsRoute);

  useEffect(() => {
    if (isRecruitmentRoute) {
      setReclutamientoOpen(true);
    }
  }, [isRecruitmentRoute]);

  useEffect(() => {
    if (isVacationsRoute) {
      setVacacionesOpen(true);
    }
  }, [isVacationsRoute]);

  const navButtonSx = (active: boolean) => ({
    minHeight: 52,
    borderRadius: "12px",
    px: 1.4,
    color: "#fff",
    border: `1px solid ${active ? alpha("#ffffff", 0.16) : "transparent"}`,
    background: active
      ? `linear-gradient(90deg, ${alpha("#1e3a8a", 0.36)} 0%, ${alpha(
          "#1e40af",
          0.16
        )} 100%)`
      : "transparent",
    "&:hover": {
      backgroundColor: alpha("#ffffff", 0.06),
    },
  });

  const navIconWrapSx = (active: boolean) => ({
    width: 30,
    height: 30,
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    backgroundColor: active ? alpha("#ffffff", 0.12) : alpha("#ffffff", 0.06),
    border: `1px solid ${alpha("#ffffff", active ? 0.12 : 0.06)}`,
  });

  const subNavButtonSx = (active: boolean) => ({
    minHeight: 46,
    borderRadius: "12px",
    pl: 2.35,
    pr: 1.35,
    ml: 2.75,
    color: "#fff",
    border: `1px solid ${active ? alpha("#ffffff", 0.12) : "transparent"}`,
    background: active
      ? `linear-gradient(90deg, ${alpha("#1e3a8a", 0.28)} 0%, ${alpha(
          "#1e40af",
          0.12
        )} 100%)`
      : "transparent",
    "&:hover": {
      backgroundColor: alpha("#ffffff", 0.05),
    },
  });

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #08152f 0%, #091831 35%, #081326 100%)",
        color: "#fff",
      }}
    >
      <Box sx={{ px: 2.25, pt: 2.25, pb: isDesktop ? 2 : 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              backgroundColor: alpha("#ffffff", 0.08),
              border: `1px solid ${alpha("#ffffff", 0.08)}`,
              boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.06)}`,
            }}
          >
            <ShieldRoundedIcon sx={{ color: "#ffffff" }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontSize: "1.75rem", fontWeight: 900, lineHeight: 1.1 }}
            >
              GV RH
            </Typography>
            <Typography
              sx={{
                fontSize: "0.92rem",
                color: alpha("#ffffff", 0.68),
              }}
            >
              Recursos Humanos
            </Typography>
          </Box>
        </Stack>
      </Box>

      {!isDesktop && (
        <Box sx={{ px: 2.25, pb: 2 }}>
          <Box
            sx={{
              borderRadius: "12px",
              px: 2,
              py: 1.75,
              background: `linear-gradient(180deg, ${alpha(
                "#ffffff",
                0.06
              )} 0%, ${alpha("#ffffff", 0.035)} 100%)`,
              border: `1px solid ${alpha("#ffffff", 0.08)}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  fontWeight: 900,
                  bgcolor: alpha("#ffffff", 0.12),
                  color: "#fff",
                }}
              >
                {initials}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} noWrap>
                  {displayName}
                </Typography>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ color: alpha("#ffffff", 0.7) }}
                >
                  {displayEmail || "Sin correo"}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={primaryRole}
              size="small"
              sx={{
                mt: 1.5,
                width: "100%",
                borderRadius: "999px",
                color: "#fff",
                fontWeight: 800,
                backgroundColor: alpha("#ffffff", 0.06),
                border: `1px solid ${alpha("#ffffff", 0.08)}`,
              }}
            />

            <Stack spacing={1} sx={{ mt: 1.5 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LogoutRoundedIcon />}
                onClick={onLogout}
                sx={{
                  borderRadius: "10px",
                  borderColor: alpha("#ffffff", 0.14),
                  color: "#fff",
                  justifyContent: "flex-start",
                }}
              >
                Cerrar sesión
              </Button>
            </Stack>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: alpha("#ffffff", 0.08) }} />

      <Box sx={{ px: 1.25, pt: 1.5, pb: 1 }}>
        <Typography
          sx={{
            px: 1,
            fontSize: "0.78rem",
            fontWeight: 900,
            letterSpacing: "0.06em",
            color: alpha("#ffffff", 0.65),
            textTransform: "uppercase",
          }}
        >
          Navegación
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1.25, pb: 2 }}>
        {navSections.map((section, sectionIndex) => (
          <Box key={section.title} sx={{ mb: 1.35 }}>
            {sectionIndex > 0 && (
              <Divider
                sx={{
                  mb: 1.25,
                  borderColor: alpha("#ffffff", 0.08),
                }}
              />
            )}

            <Typography
              sx={{
                px: 1.05,
                mb: 0.85,
                fontSize: "0.72rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                color: alpha("#ffffff", 0.48),
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </Typography>

            <List sx={{ p: 0, display: "grid", gap: 0.75 }}>
              {section.entries.map((entry, entryIndex) => {
                if (entry.type === "item") {
                  const active = isRouteActive(pathname, entry.item.to);

                  return (
                    <ListItemButton
                      key={`${section.title}-${entry.item.to}-${entryIndex}`}
                      component={RouterLink}
                      to={entry.item.to}
                      onClick={onNavigate}
                      sx={navButtonSx(active)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: active ? "#ffffff" : alpha("#ffffff", 0.82),
                        }}
                      >
                        <Box sx={navIconWrapSx(active)}>{entry.item.icon}</Box>
                      </ListItemIcon>

                      <ListItemText
                        primary={entry.item.label}
                        primaryTypographyProps={{
                          fontSize: "0.98rem",
                          fontWeight: active ? 800 : 700,
                        }}
                      />

                      <ChevronRightRoundedIcon
                        sx={{
                          color: active ? "#fff" : alpha("#ffffff", 0.45),
                          fontSize: 20,
                        }}
                      />
                    </ListItemButton>
                  );
                }

                if (entry.type === "vacations") {
                  return (
                    <Box key={`${section.title}-vacations-${entryIndex}`}>
                      <ListItemButton
                        onClick={() => setVacacionesOpen((prev) => !prev)}
                        sx={navButtonSx(isVacationsRoute)}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: isVacationsRoute
                              ? "#ffffff"
                              : alpha("#ffffff", 0.82),
                          }}
                        >
                          <Box sx={navIconWrapSx(isVacationsRoute)}>
                            <UploadFileRoundedIcon />
                          </Box>
                        </ListItemIcon>

                        <ListItemText
                          primary="Vacaciones"
                          primaryTypographyProps={{
                            fontSize: "0.98rem",
                            fontWeight: isVacationsRoute ? 800 : 700,
                          }}
                        />

                        {vacacionesOpen ? (
                          <ExpandLessRoundedIcon
                            sx={{
                              color: isVacationsRoute
                                ? "#fff"
                                : alpha("#ffffff", 0.55),
                            }}
                          />
                        ) : (
                          <ExpandMoreRoundedIcon
                            sx={{
                              color: isVacationsRoute
                                ? "#fff"
                                : alpha("#ffffff", 0.55),
                            }}
                          />
                        )}
                      </ListItemButton>

                      <Collapse in={vacacionesOpen} timeout="auto" unmountOnExit>
                        <List sx={{ p: 0, pt: 0.75, display: "grid", gap: 0.6 }}>
                          <ListItemButton
                            component={RouterLink}
                            to="/vacaciones/conciliacion"
                            onClick={onNavigate}
                            sx={subNavButtonSx(isVacacionesConciliacionRoute)}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 34,
                                color: isVacacionesConciliacionRoute
                                  ? "#ffffff"
                                  : alpha("#ffffff", 0.78),
                              }}
                            >
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "9px",
                                  display: "grid",
                                  placeItems: "center",
                                  backgroundColor: isVacacionesConciliacionRoute
                                    ? alpha("#ffffff", 0.1)
                                    : alpha("#ffffff", 0.05),
                                  border: `1px solid ${alpha(
                                    "#ffffff",
                                    isVacacionesConciliacionRoute ? 0.1 : 0.05
                                  )}`,
                                }}
                              >
                                <FactCheckRoundedIcon sx={{ fontSize: 17 }} />
                              </Box>
                            </ListItemIcon>

                            <ListItemText
                              primary="Validar Excel"
                              primaryTypographyProps={{
                                fontSize: "0.93rem",
                                fontWeight: isVacacionesConciliacionRoute
                                  ? 800
                                  : 600,
                              }}
                            />
                          </ListItemButton>

                          <ListItemButton
                            component={RouterLink}
                            to="/vacaciones/importacion"
                            onClick={onNavigate}
                            sx={subNavButtonSx(isVacacionesImportacionRoute)}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 34,
                                color: isVacacionesImportacionRoute
                                  ? "#ffffff"
                                  : alpha("#ffffff", 0.78),
                              }}
                            >
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "9px",
                                  display: "grid",
                                  placeItems: "center",
                                  backgroundColor: isVacacionesImportacionRoute
                                    ? alpha("#ffffff", 0.1)
                                    : alpha("#ffffff", 0.05),
                                  border: `1px solid ${alpha(
                                    "#ffffff",
                                    isVacacionesImportacionRoute ? 0.1 : 0.05
                                  )}`,
                                }}
                              >
                                <UploadFileRoundedIcon sx={{ fontSize: 17 }} />
                              </Box>
                            </ListItemIcon>

                            <ListItemText
                              primary="Importar saldos"
                              primaryTypographyProps={{
                                fontSize: "0.93rem",
                                fontWeight: isVacacionesImportacionRoute
                                  ? 800
                                  : 600,
                              }}
                            />
                          </ListItemButton>

                          <ListItemButton
                            component={RouterLink}
                            to="/vacaciones/reportes/saldos"
                            onClick={onNavigate}
                            sx={subNavButtonSx(isVacacionesSaldosRoute)}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 34,
                                color: isVacacionesSaldosRoute
                                  ? "#ffffff"
                                  : alpha("#ffffff", 0.78),
                              }}
                            >
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "9px",
                                  display: "grid",
                                  placeItems: "center",
                                  backgroundColor: isVacacionesSaldosRoute
                                    ? alpha("#ffffff", 0.1)
                                    : alpha("#ffffff", 0.05),
                                  border: `1px solid ${alpha(
                                    "#ffffff",
                                    isVacacionesSaldosRoute ? 0.1 : 0.05
                                  )}`,
                                }}
                              >
                                <TableViewRoundedIcon sx={{ fontSize: 17 }} />
                              </Box>
                            </ListItemIcon>

                            <ListItemText
                              primary="Reporte de saldos"
                              primaryTypographyProps={{
                                fontSize: "0.93rem",
                                fontWeight: isVacacionesSaldosRoute ? 800 : 600,
                              }}
                            />
                          </ListItemButton>

                          <ListItemButton
                            component={RouterLink}
                            to="/vacaciones/reportes/kardex"
                            onClick={onNavigate}
                            sx={subNavButtonSx(isVacacionesKardexRoute)}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 34,
                                color: isVacacionesKardexRoute
                                  ? "#ffffff"
                                  : alpha("#ffffff", 0.78),
                              }}
                            >
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "9px",
                                  display: "grid",
                                  placeItems: "center",
                                  backgroundColor: isVacacionesKardexRoute
                                    ? alpha("#ffffff", 0.1)
                                    : alpha("#ffffff", 0.05),
                                  border: `1px solid ${alpha(
                                    "#ffffff",
                                    isVacacionesKardexRoute ? 0.1 : 0.05
                                  )}`,
                                }}
                              >
                                <FactCheckRoundedIcon sx={{ fontSize: 17 }} />
                              </Box>
                            </ListItemIcon>

                            <ListItemText
                              primary="Reporte de kárdex"
                              primaryTypographyProps={{
                                fontSize: "0.93rem",
                                fontWeight: isVacacionesKardexRoute ? 800 : 600,
                              }}
                            />
                          </ListItemButton>
                        </List>
                      </Collapse>
                    </Box>
                  );
                }

                return (
                  <Box key={`${section.title}-recruitment-${entryIndex}`}>
                    <ListItemButton
                      onClick={() => setReclutamientoOpen((prev) => !prev)}
                      sx={navButtonSx(isRecruitmentRoute)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: isRecruitmentRoute
                            ? "#ffffff"
                            : alpha("#ffffff", 0.82),
                        }}
                      >
                        <Box sx={navIconWrapSx(isRecruitmentRoute)}>
                          <BusinessCenterRoundedIcon />
                        </Box>
                      </ListItemIcon>

                      <ListItemText
                        primary="Reclutamiento"
                        primaryTypographyProps={{
                          fontSize: "0.98rem",
                          fontWeight: isRecruitmentRoute ? 800 : 700,
                        }}
                      />

                      {reclutamientoOpen ? (
                        <ExpandLessRoundedIcon
                          sx={{
                            color: isRecruitmentRoute
                              ? "#fff"
                              : alpha("#ffffff", 0.55),
                          }}
                        />
                      ) : (
                        <ExpandMoreRoundedIcon
                          sx={{
                            color: isRecruitmentRoute
                              ? "#fff"
                              : alpha("#ffffff", 0.55),
                          }}
                        />
                      )}
                    </ListItemButton>

                    <Collapse in={reclutamientoOpen} timeout="auto" unmountOnExit>
                      <List sx={{ p: 0, pt: 0.75, display: "grid", gap: 0.6 }}>
                        <ListItemButton
                          component={RouterLink}
                          to="/reclutamiento"
                          onClick={onNavigate}
                          sx={subNavButtonSx(isResumenRoute)}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 34,
                              color: isResumenRoute
                                ? "#ffffff"
                                : alpha("#ffffff", 0.78),
                            }}
                          >
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "9px",
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: isResumenRoute
                                  ? alpha("#ffffff", 0.1)
                                  : alpha("#ffffff", 0.05),
                                border: `1px solid ${alpha(
                                  "#ffffff",
                                  isResumenRoute ? 0.1 : 0.05
                                )}`,
                              }}
                            >
                              <BusinessCenterRoundedIcon sx={{ fontSize: 17 }} />
                            </Box>
                          </ListItemIcon>

                          <ListItemText
                            primary="Resumen"
                            primaryTypographyProps={{
                              fontSize: "0.93rem",
                              fontWeight: isResumenRoute ? 800 : 600,
                            }}
                          />
                        </ListItemButton>

                        <ListItemButton
                          component={RouterLink}
                          to="/reclutamiento/candidatos"
                          onClick={onNavigate}
                          sx={subNavButtonSx(isCandidatosRoute)}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 34,
                              color: isCandidatosRoute
                                ? "#ffffff"
                                : alpha("#ffffff", 0.78),
                            }}
                          >
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "9px",
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: isCandidatosRoute
                                  ? alpha("#ffffff", 0.1)
                                  : alpha("#ffffff", 0.05),
                                border: `1px solid ${alpha(
                                  "#ffffff",
                                  isCandidatosRoute ? 0.1 : 0.05
                                )}`,
                              }}
                            >
                              <PersonSearchRoundedIcon sx={{ fontSize: 17 }} />
                            </Box>
                          </ListItemIcon>

                          <ListItemText
                            primary="Candidatos"
                            primaryTypographyProps={{
                              fontSize: "0.93rem",
                              fontWeight: isCandidatosRoute ? 800 : 600,
                            }}
                          />
                        </ListItemButton>

                        <ListItemButton
                          component={RouterLink}
                          to="/reclutamiento/vacantes"
                          onClick={onNavigate}
                          sx={subNavButtonSx(isVacantesRoute)}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 34,
                              color: isVacantesRoute
                                ? "#ffffff"
                                : alpha("#ffffff", 0.78),
                            }}
                          >
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: "9px",
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: isVacantesRoute
                                  ? alpha("#ffffff", 0.1)
                                  : alpha("#ffffff", 0.05),
                                border: `1px solid ${alpha(
                                  "#ffffff",
                                  isVacantesRoute ? 0.1 : 0.05
                                )}`,
                              }}
                            >
                              <WorkOutlineRoundedIcon sx={{ fontSize: 17 }} />
                            </Box>
                          </ListItemIcon>

                          <ListItemText
                            primary="Vacantes"
                            primaryTypographyProps={{
                              fontSize: "0.93rem",
                              fontWeight: isVacantesRoute ? 800 : 600,
                            }}
                          />
                        </ListItemButton>
                      </List>
                    </Collapse>
                  </Box>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const auth = useAuth() as any;
  const user = auth?.user ?? null;
  const roles = auth?.roles ?? [];
  const logout = auth?.logout ?? (() => {});
  const primaryRole = normalizeRoles(roles)[0] ?? "USUARIO";

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const displayEmail = useMemo(() => getDisplayEmail(user), [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const breadcrumb = useMemo(
    () => getPageBreadcrumb(location.pathname),
    [location.pathname]
  );
  const headerMeta = useMemo(
    () => getPageHeaderMeta(location.pathname),
    [location.pathname]
  );
  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname]
  );
  const pageSubtitle = useMemo(
    () => getPageSubtitle(location.pathname),
    [location.pathname]
  );
  const showBreadcrumb = useMemo(
    () => shouldShowBreadcrumb(breadcrumb, pageTitle),
    [breadcrumb, pageTitle]
  );
  const showHeaderMeta = useMemo(
    () => shouldShowHeaderMeta(location.pathname, breadcrumb, pageTitle),
    [location.pathname, breadcrumb, pageTitle]
  );

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleCloseDrawer = () => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    setAccountAnchor(null);
    handleCloseDrawer();
    await Promise.resolve(logout());
  };

  const drawer = (
    <SidebarContent
      pathname={location.pathname}
      roles={roles}
      displayName={displayName}
      displayEmail={displayEmail}
      initials={initials}
      isDesktop={isDesktop}
      onNavigate={handleCloseDrawer}
      onLogout={handleLogout}
    />
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          backdropFilter: "blur(10px)",
          backgroundColor: alpha("#ffffff", 0.82),
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          width: isDesktop ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
          ml: isDesktop ? `${DRAWER_WIDTH}px` : 0,
        }}
      >
        <Toolbar sx={{ minHeight: 84, px: { xs: 2, md: 3 } }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {showHeaderMeta || showBreadcrumb ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                sx={{ mb: 0.85 }}
              >
                {showHeaderMeta ? (
                  <Chip
                    icon={headerMeta.icon}
                    label={headerMeta.label}
                    size="small"
                    sx={{
                      height: 28,
                      borderRadius: "999px",
                      fontWeight: 800,
                      color: "#0f172a",
                      backgroundColor: alpha("#1d4ed8", 0.08),
                      border: `1px solid ${alpha("#1d4ed8", 0.16)}`,
                      "& .MuiChip-icon": {
                        color: "#1d4ed8",
                        ml: 0.6,
                      },
                    }}
                  />
                ) : null}

                {showBreadcrumb ? (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    {breadcrumb.map((item, index) => (
                      <Stack
                        key={`${item}-${index}`}
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                      >
                        {index > 0 ? (
                          <ChevronRightIcon
                            sx={{ fontSize: 16, color: alpha("#64748b", 0.9) }}
                          />
                        ) : null}

                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: index === breadcrumb.length - 1 ? 800 : 700,
                            color:
                              index === breadcrumb.length - 1
                                ? "#1d4ed8"
                                : "#64748b",
                          }}
                        >
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            <Typography
              variant="h5"
              sx={{ fontWeight: 900, lineHeight: 1.1, color: "#0f172a" }}
            >
              {pageTitle}
            </Typography>

            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.35 }}>
              {pageSubtitle}
            </Typography>
          </Box>

          {isDesktop ? (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Chip
                label={primaryRole}
                size="small"
                sx={{
                  borderRadius: "999px",
                  fontWeight: 800,
                  color: "#334155",
                  backgroundColor: "#eef2f7",
                }}
              />

              <Button
                onClick={(event) => setAccountAnchor(event.currentTarget)}
                variant="text"
                sx={{
                  px: 1.1,
                  py: 0.7,
                  minWidth: 0,
                  borderRadius: "12px",
                  color: "#0f172a",
                  textTransform: "none",
                  backgroundColor: alpha("#0f172a", 0.02),
                  border: `1px solid ${alpha("#0f172a", 0.06)}`,
                  "&:hover": {
                    backgroundColor: alpha("#1e3a8a", 0.05),
                    borderColor: alpha("#1e3a8a", 0.12),
                  },
                }}
              >
                <Stack direction="row" spacing={1.1} alignItems="center">
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      fontWeight: 900,
                      color: "#ffffff",
                      background:
                        "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
                      boxShadow: "0 8px 18px rgba(29, 78, 216, 0.22)",
                    }}
                  >
                    {initials}
                  </Avatar>

                  <Box sx={{ textAlign: "left", minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.98rem",
                        fontWeight: 800,
                        lineHeight: 1.1,
                      }}
                    >
                      {displayName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: "#64748b",
                        lineHeight: 1.1,
                      }}
                    >
                      {displayEmail || "Sin correo"}
                    </Typography>
                  </Box>
                </Stack>
              </Button>

              <Menu
                anchorEl={accountAnchor}
                open={Boolean(accountAnchor)}
                onClose={() => setAccountAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 1.25,
                    minWidth: 260,
                    overflow: "hidden",
                    borderRadius: "12px",
                    border: `1px solid ${alpha("#1e3a8a", 0.12)}`,
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                    boxShadow: "0 22px 50px rgba(15, 23, 42, 0.18)",
                  },
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.75,
                    background:
                      "linear-gradient(135deg, #0b1630 0%, #16315f 100%)",
                    color: "#ffffff",
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        fontWeight: 900,
                        color: "#ffffff",
                        backgroundColor: alpha("#ffffff", 0.14),
                        border: `1px solid ${alpha("#ffffff", 0.16)}`,
                      }}
                    >
                      {initials}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.98rem",
                          fontWeight: 800,
                          lineHeight: 1.1,
                          color: "#ffffff",
                        }}
                      >
                        {displayName}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          lineHeight: 1.15,
                          color: alpha("#ffffff", 0.78),
                        }}
                      >
                        {displayEmail || "Sin correo"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    label={primaryRole}
                    size="small"
                    sx={{
                      mt: 1.5,
                      borderRadius: "999px",
                      fontWeight: 800,
                      color: "#ffffff",
                      backgroundColor: alpha("#ffffff", 0.12),
                      border: `1px solid ${alpha("#ffffff", 0.12)}`,
                    }}
                  />
                </Box>

                <Box sx={{ py: 0.75 }}>
                  <MenuItem
                    onClick={() => {
                      setAccountAnchor(null);
                      navigate("/cambiar-password");
                    }}
                    sx={{
                      mx: 1,
                      my: 0.25,
                      borderRadius: "10px",
                      minHeight: 44,
                      fontWeight: 600,
                      color: "#0f172a",
                      "&:hover": {
                        backgroundColor: alpha("#1e40af", 0.06),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <LockRoundedIcon fontSize="small" />
                      <span>Cambiar contraseña</span>
                    </Stack>
                  </MenuItem>

                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      mx: 1,
                      my: 0.25,
                      borderRadius: "10px",
                      minHeight: 44,
                      fontWeight: 700,
                      color: "#991b1b",
                      "&:hover": {
                        backgroundColor: alpha("#dc2626", 0.06),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <LogoutRoundedIcon fontSize="small" />
                      <span>Cerrar sesión</span>
                    </Stack>
                  </MenuItem>
                </Box>
              </Menu>
            </Stack>
          ) : null}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { lg: DRAWER_WIDTH },
          flexShrink: { lg: 0 },
        }}
      >
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop ? true : mobileOpen}
          onClose={handleCloseDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              borderRight: "none",
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          pt: "84px",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3.5 } }}>{children ?? <Outlet />}</Box>
      </Box>
    </Box>
  );
}
