import type { MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
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
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const drawerWidth = 264;
const appBarHeight = 72;
const changePasswordRoute = "/cambiar-password";

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

type AuthUserShape = {
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
} | null | undefined;

function normalizeRoles(roles?: string[] | null): string[] {
  return [
    ...new Set((roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function canAccess(userRoles: string[], allowedRoles?: string[]) {
  if (!allowedRoles?.length) return true;
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

function getUserDisplayName(user: AuthUserShape) {
  const fullName = user?.fullName?.trim();
  if (fullName) return fullName;

  const name = user?.name?.trim();
  if (name) return name;

  const email = user?.email?.trim();
  if (email) return email.split("@")[0] || email;

  return "Usuario";
}

function getUserInitial(displayName: string) {
  const normalized = displayName.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "U";
}

function roleChipSx() {
  return {
    color: "#e5e7eb",
    borderColor: alpha("#ffffff", 0.12),
    backgroundColor: alpha("#ffffff", 0.06),
    fontWeight: 800,
    borderRadius: "999px",
  } as const;
}

function topbarRoleChipSx() {
  return {
    fontWeight: 800,
    borderColor: alpha("#0f172a", 0.08),
    backgroundColor: alpha("#0f172a", 0.04),
    color: "#334155",
    borderRadius: "999px",
    height: 28,
  } as const;
}

function sidebarItemSx(selected: boolean) {
  return {
    minHeight: 52,
    borderRadius: "18px",
    mb: 0.75,
    px: 1.5,
    color: selected ? "#ffffff" : "#cbd5e1",
    backgroundColor: selected ? "rgba(255,255,255,0.10)" : "transparent",
    border: `1px solid ${selected ? "rgba(255,255,255,0.12)" : "transparent"}`,
    transition:
      "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
    "&:hover": {
      backgroundColor: selected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
      borderColor: selected ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
      transform: "translateX(1px)",
    },
    "& .MuiListItemIcon-root": {
      minWidth: 40,
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

function topbarUserButtonSx(open: boolean) {
  return {
    appearance: "none",
    border: `1px solid ${alpha("#0f172a", open ? 0.14 : 0.08)}`,
    backgroundColor: open ? alpha("#0f172a", 0.05) : alpha("#ffffff", 0.96),
    color: "#0f172a",
    borderRadius: "999px",
    px: { xs: 0.9, sm: 1.05, md: 1.2 },
    py: 0.65,
    display: "inline-flex",
    alignItems: "center",
    gap: 0.9,
    minHeight: 46,
    cursor: "pointer",
    transition: "all 180ms ease",
    boxShadow: open ? "0 8px 20px rgba(15, 23, 42, 0.06)" : "none",
    "&:hover": {
      backgroundColor: alpha("#0f172a", 0.045),
      borderColor: alpha("#0f172a", 0.12),
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
    },
  } as const;
}

function userMenuPaperSx() {
  return {
    mt: 1.25,
    minWidth: 312,
    borderRadius: "22px",
    border: `1px solid ${alpha("#0f172a", 0.08)}`,
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.14)",
    overflow: "hidden",
    backgroundImage:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
  } as const;
}

function userMenuActionSx(danger = false) {
  return {
    mx: 1,
    my: 0.5,
    borderRadius: "14px",
    py: 1.15,
    px: 1.25,
    gap: 1,
    color: danger ? "#b91c1c" : "#0f172a",
    "&:hover": {
      backgroundColor: danger
        ? alpha("#b91c1c", 0.06)
        : alpha("#0f172a", 0.045),
    },
  } as const;
}

export default function AppShell() {
  const { logout, roles = [], user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const userInitial = useMemo(() => getUserInitial(displayName), [displayName]);
  const primaryRole = normalizedRoles[0] ?? "SIN ROL";
  const isUserMenuOpen = Boolean(userMenuAnchorEl);

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

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchorEl(null);
  };

  const handleGoToChangePassword = () => {
    handleCloseUserMenu();
    setMobileOpen(false);
    navigate(changePasswordRoute);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    setMobileOpen(false);
    await logout();
  };

  const sidebarContent = (
    <>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "15px",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
                mb: 1.5,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <ShieldRoundedIcon />
            </Box>

            <Typography variant="h6" fontWeight={900} lineHeight={1.05}>
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
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentTitle}
              </Typography>
            </Box>
          </Stack>

          <Box
            component="button"
            type="button"
            onClick={handleOpenUserMenu}
            sx={topbarUserButtonSx(isUserMenuOpen)}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: 14,
                fontWeight: 900,
                bgcolor: "#0f172a",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.18)",
              }}
            >
              {userInitial}
            </Avatar>

            <Stack
              spacing={0}
              sx={{
                display: { xs: "none", sm: "flex" },
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 150,
                }}
              >
                {displayName}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  display: { xs: "none", md: "block" },
                  color: "#64748b",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 170,
                }}
              >
                {user?.email ?? "Sin correo"}
              </Typography>
            </Stack>

            <Chip
              size="small"
              label={primaryRole}
              variant="outlined"
              sx={{
                display: { xs: "none", lg: "inline-flex" },
                ...topbarRoleChipSx(),
              }}
            />

            <KeyboardArrowDownRoundedIcon
              fontSize="small"
              sx={{
                color: "#64748b",
                transform: isUserMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 180ms ease",
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={userMenuAnchorEl}
        open={isUserMenuOpen}
        onClose={handleCloseUserMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: userMenuPaperSx(),
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 2,
            background:
              "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,64,175,0.94) 100%)",
            color: "#ffffff",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 46,
                height: 46,
                fontSize: 16,
                fontWeight: 900,
                bgcolor: alpha("#ffffff", 0.16),
                color: "#ffffff",
                border: `1px solid ${alpha("#ffffff", 0.18)}`,
              }}
            >
              {userInitial}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.25,
                  color: alpha("#ffffff", 0.82),
                  wordBreak: "break-word",
                }}
              >
                {user?.email ?? "Sin correo"}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.5 }}
          >
            {normalizedRoles.length > 0 ? (
              normalizedRoles.slice(0, 3).map((role) => (
                <Chip
                  key={role}
                  size="small"
                  label={role}
                  variant="outlined"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.22),
                    backgroundColor: alpha("#ffffff", 0.08),
                    fontWeight: 800,
                  }}
                />
              ))
            ) : (
              <Chip
                size="small"
                label="SIN ROL"
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: alpha("#ffffff", 0.22),
                  backgroundColor: alpha("#ffffff", 0.08),
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        </Box>

        <Box sx={{ py: 1 }}>
          <MenuItem onClick={handleGoToChangePassword} sx={userMenuActionSx(false)}>
            <ListItemIcon sx={{ minWidth: 34, color: "#334155" }}>
              <VpnKeyRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Cambiar contraseña"
              secondary="Actualizar credenciales de acceso"
              primaryTypographyProps={{ fontWeight: 800, fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 12, color: "#64748b" }}
            />
            <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
          </MenuItem>

          <MenuItem
            onClick={() => {
              void handleLogout();
            }}
            sx={userMenuActionSx(true)}
          >
            <ListItemIcon sx={{ minWidth: 34, color: "#b91c1c" }}>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar sesión"
              secondary="Salir de la sesión actual"
              primaryTypographyProps={{
                fontWeight: 800,
                fontSize: 14,
                color: "#b91c1c",
              }}
              secondaryTypographyProps={{ fontSize: 12, color: "#7f1d1d" }}
            />
            <ChevronRightRoundedIcon
              fontSize="small"
              sx={{ color: alpha("#b91c1c", 0.55) }}
            />
          </MenuItem>
        </Box>
      </Menu>

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