import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import KeyboardDoubleArrowRightRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowRightRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const drawerWidth = 264;
const appBarHeight = 72;

type MenuItemConfig = {
  label: string;
  to: string;
  icon: ReactNode;
  allow?: string[];
};

const menuItems: MenuItemConfig[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: <HomeRoundedIcon fontSize="small" />,
  },
  {
    label: "Usuarios",
    to: "/usuarios",
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
    allow: ["ADMIN"],
  },
  {
    label: "Sucursales",
    to: "/sucursales",
    icon: <StoreRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
  {
    label: "Auditoría",
    to: "/audit",
    icon: <GavelRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
  {
    label: "Departamentos",
    to: "/departamentos",
    icon: <ApartmentRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
  {
    label: "Puestos",
    to: "/puestos",
    icon: <WorkOutlineRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
  {
    label: "Empleados",
    to: "/empleados",
    icon: <BadgeRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
  {
    label: "Incidencias",
    to: "/incidencias",
    icon: <EventNoteRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
];

function normalizeRoles(roles?: string[] | null): string[] {
  return [
    ...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function canAccess(userRoles: string[], allowedRoles?: string[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role.toUpperCase()));
}

function isRouteSelected(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function getCurrentTitle(pathname: string, items: MenuItemConfig[]) {
  return items.find((item) => isRouteSelected(pathname, item.to))?.label ?? "GV RH";
}

function getCurrentSectionText(pathname: string) {
  if (isRouteSelected(pathname, "/dashboard")) return "Vista general";
  if (isRouteSelected(pathname, "/usuarios")) return "Seguridad y accesos";
  if (isRouteSelected(pathname, "/empleados")) return "Gestión de personal";
  if (isRouteSelected(pathname, "/incidencias")) return "Operación diaria";
  if (isRouteSelected(pathname, "/audit")) return "Trazabilidad del sistema";
  if (isRouteSelected(pathname, "/departamentos")) return "Estructura interna";
  if (isRouteSelected(pathname, "/puestos")) return "Catálogo organizacional";
  if (isRouteSelected(pathname, "/sucursales")) return "Cobertura operativa";
  return "Sistema interno";
}

function sidebarItemSx(selected: boolean) {
  return {
    minHeight: 50,
    borderRadius: "16px",
    mb: 0.75,
    px: 1.5,
    color: selected ? "#ffffff" : "#cbd5e1",
    backgroundColor: selected ? "rgba(255,255,255,0.10)" : "transparent",
    border: `1px solid ${
      selected ? "rgba(255,255,255,0.10)" : "transparent"
    }`,
    transition:
      "background-color 160ms ease, border-color 160ms ease, transform 160ms ease",
    "&:hover": {
      backgroundColor: selected
        ? "rgba(255,255,255,0.14)"
        : "rgba(255,255,255,0.06)",
      borderColor: selected
        ? "rgba(255,255,255,0.14)"
        : "rgba(255,255,255,0.06)",
      transform: "translateX(1px)",
    },
    "& .MuiListItemIcon-root": {
      minWidth: 38,
      color: selected ? "#ffffff" : "#94a3b8",
    },
  } as const;
}

function sidebarIconWrapSx(selected: boolean) {
  return {
    width: 30,
    height: 30,
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    backgroundColor: selected
      ? "rgba(255,255,255,0.14)"
      : "rgba(255,255,255,0.04)",
    border: `1px solid ${
      selected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"
    }`,
  } as const;
}

function roleChipSx() {
  return {
    color: "#e5e7eb",
    borderColor: alpha("#ffffff", 0.12),
    backgroundColor: alpha("#ffffff", 0.06),
    fontWeight: 800,
  } as const;
}

function topbarRoleChipSx() {
  return {
    fontWeight: 800,
    borderColor: alpha("#0f172a", 0.1),
    backgroundColor: alpha("#0f172a", 0.03),
    color: "#334155",
  } as const;
}

function topbarGhostButtonSx() {
  return {
    display: { xs: "none", sm: "inline-flex" },
    borderRadius: "999px",
    textTransform: "none",
    fontWeight: 700,
    px: 2,
  } as const;
}

function sessionInfoCardSx() {
  return {
    p: 2,
    borderRadius: "20px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  } as const;
}

function mobileSessionButtonSx() {
  return {
    color: "#e5e7eb",
    borderColor: "rgba(255,255,255,0.12)",
    fontWeight: 700,
    "&:hover": {
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(255,255,255,0.05)",
    },
  } as const;
}

function getUserDisplayName(
  user?: {
    fullName?: string | null;
    email?: string | null;
  } | null
) {
  const fullName = user?.fullName?.trim();
  if (fullName) return fullName;

  const email = user?.email?.trim();
  if (email) return email.split("@")[0] || email;

  return "Usuario";
}

export default function AppShell() {
  const { logout, roles = [], user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const primaryRole = normalizedRoles[0] ?? "SIN ROL";

  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => canAccess(normalizedRoles, item.allow)),
    [normalizedRoles]
  );

  const currentTitle = useMemo(
    () => getCurrentTitle(location.pathname, visibleMenuItems),
    [location.pathname, visibleMenuItems]
  );

  const currentSectionText = useMemo(
    () => getCurrentSectionText(location.pathname),
    [location.pathname]
  );

  const handleNavigate = (to: string) => {
    navigate(to);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
  };

  const handleGoToChangePassword = () => {
    navigate("/cambiar-password");
    setMobileOpen(false);
  };

  const sessionInfoContent = (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 700 }}>
        Sesión activa
      </Typography>

      <Typography sx={{ fontWeight: 800, color: "#f8fafc", lineHeight: 1.15 }}>
        {displayName}
      </Typography>

      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
        {user?.email ?? "Sin correo"}
      </Typography>

      <Chip
        size="small"
        label={primaryRole}
        variant="outlined"
        sx={{
          width: "fit-content",
          ...roleChipSx(),
        }}
      />

      <Typography variant="body2" sx={{ color: "#94a3b8", pt: 0.5 }}>
        Acceso a módulos, catálogos, incidencias y bitácora del sistema.
      </Typography>
    </Stack>
  );

  const sidebarContent = (
    <>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
                mb: 1.5,
              }}
            >
              <ShieldRoundedIcon />
            </Box>

            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
              GV RH
            </Typography>

            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
              Administración de personal
            </Typography>
          </Box>

          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{
              display: { xs: "inline-flex", lg: "none" },
              color: "#e5e7eb",
              alignSelf: "flex-start",
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {normalizedRoles.length > 0 ? (
          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.5 }}
          >
            {normalizedRoles.slice(0, 3).map((role) => (
              <Chip
                key={role}
                size="small"
                label={role}
                variant="outlined"
                sx={roleChipSx()}
              />
            ))}
          </Stack>
        ) : null}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Typography
          variant="overline"
          sx={{
            px: 1,
            color: "#94a3b8",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          Navegación principal
        </Typography>
      </Box>

      <List sx={{ px: 1.25, py: 0.5 }}>
        {visibleMenuItems.map((item) => {
          const selected = isRouteSelected(location.pathname, item.to);

          return (
            <ListItemButton
              key={item.to}
              selected={selected}
              onClick={() => handleNavigate(item.to)}
              sx={sidebarItemSx(selected)}
            >
              <ListItemIcon>
                <Box sx={sidebarIconWrapSx(selected)}>{item.icon}</Box>
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                secondary={selected ? "Vista actual" : undefined}
                primaryTypographyProps={{
                  fontWeight: selected ? 800 : 700,
                  fontSize: 14,
                }}
                secondaryTypographyProps={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.56)",
                }}
              />

              {selected ? (
                <KeyboardDoubleArrowRightRoundedIcon
                  fontSize="small"
                  sx={{ color: "#ffffff", opacity: 0.9 }}
                />
              ) : null}
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 1.5 }}>
        <Box sx={sessionInfoCardSx()}>
          {sessionInfoContent}

          <Stack
            spacing={1}
            sx={{
              mt: 1.5,
              display: { xs: "flex", lg: "none" },
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              startIcon={<VpnKeyRoundedIcon />}
              onClick={handleGoToChangePassword}
              sx={mobileSessionButtonSx()}
            >
              Cambiar contraseña
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutRoundedIcon />}
              onClick={() => {
                void handleLogout();
              }}
              sx={mobileSessionButtonSx()}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Box>
      </Box>
    </>
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: appBarHeight,
          width: { xs: "100%", lg: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, lg: `${drawerWidth}px` },
          justifyContent: "center",
          backgroundColor: alpha("#ffffff", 0.94),
          color: "#111827",
          borderBottom: "1px solid #e5e7eb",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${appBarHeight}px !important`,
            px: { xs: 2, md: 3 },
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                color: "#334155",
                border: `1px solid ${alpha("#0f172a", 0.08)}`,
                backgroundColor: alpha("#0f172a", 0.02),
              }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: "#64748b",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  lineHeight: 1.4,
                  mb: 0.25,
                }}
              >
                {currentSectionText}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentTitle}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <Stack
              direction="column"
              spacing={0.1}
              alignItems="flex-end"
              sx={{ display: { xs: "none", md: "flex" }, mr: 0.5 }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}
              >
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {user?.email ?? "Sin correo"}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              {normalizedRoles.slice(0, 2).map((role) => (
                <Chip
                  key={role}
                  size="small"
                  label={role}
                  variant="outlined"
                  sx={topbarRoleChipSx()}
                />
              ))}
            </Stack>

            <Button
              variant="outlined"
              startIcon={<VpnKeyRoundedIcon />}
              onClick={handleGoToChangePassword}
              sx={topbarGhostButtonSx()}
            >
              Cambiar contraseña
            </Button>

            <Button
              variant="outlined"
              startIcon={<LogoutRoundedIcon />}
              onClick={() => {
                void handleLogout();
              }}
              sx={topbarGhostButtonSx()}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        open
        PaperProps={{
          sx: {
            display: { xs: "none", lg: "flex" },
            width: drawerWidth,
            boxSizing: "border-box",
            background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
            color: "#f9fafb",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
            color: "#f9fafb",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: { xs: 0, lg: `${drawerWidth}px` },
          pt: `calc(${appBarHeight}px + 24px)`,
          px: { xs: 2, md: 3 },
          pb: 3,
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}