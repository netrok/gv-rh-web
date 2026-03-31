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
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
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
  {
    label: "Vacantes",
    to: "/reclutamiento/vacantes",
    icon: <WorkOutlineRoundedIcon fontSize="small" />,
    allow: ["ADMIN", "RRHH"],
  },
  {
    label: "Candidatos",
    to: "/reclutamiento/candidatos",
    icon: <Groups2RoundedIcon fontSize="small" />,
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
  if (isRouteSelected(pathname, "/reclutamiento")) return "Atracción de talento";
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
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.22)",
              }}
            >
              <ShieldRoundedIcon fontSize="small" />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
                GV RH
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#94a3b8", fontSize: 12.5 }}
              >
                Recursos Humanos
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              borderRadius: "20px",
              p: 1.6,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    fontWeight: 900,
                    backgroundColor: alpha("#ffffff", 0.12),
                    color: "#ffffff",
                  }}
                >
                  {userInitial}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 14.5,
                      color: "#f8fafc",
                    }}
                    noWrap
                  >
                    {displayName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#94a3b8", fontSize: 12.5 }}
                    noWrap
                  >
                    {user?.email ?? "Sin correo"}
                  </Typography>
                </Box>
              </Stack>

              <Chip
                variant="outlined"
                size="small"
                label={primaryRole}
                sx={roleChipSx()}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box sx={{ px: 1.5, py: 1.5, overflowY: "auto", flex: 1 }}>
        <Typography
          sx={{
            px: 1.2,
            mb: 1.2,
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Navegación
        </Typography>

        <List disablePadding>
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
                  primaryTypographyProps={{
                    fontWeight: selected ? 900 : 700,
                    fontSize: 14,
                  }}
                />

                <KeyboardDoubleArrowRightRoundedIcon
                  fontSize="small"
                  sx={{
                    opacity: selected ? 1 : 0.35,
                    color: selected ? "#ffffff" : "#94a3b8",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </>
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AppBar
        elevation={0}
        color="inherit"
        sx={{
          height: appBarHeight,
          justifyContent: "center",
          backgroundColor: alpha("#ffffff", 0.92),
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
          ml: { lg: `${drawerWidth}px` },
          width: { lg: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar sx={{ minHeight: `${appBarHeight}px !important`, px: { xs: 2, md: 3 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: "100%" }}
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                onClick={() => setMobileOpen((prev) => !prev)}
                sx={{
                  display: { lg: "none" },
                  border: `1px solid ${alpha("#0f172a", 0.08)}`,
                  backgroundColor: "#ffffff",
                }}
              >
                {mobileOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
              </IconButton>

              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 19, md: 22 },
                    fontWeight: 900,
                    color: "#0f172a",
                    lineHeight: 1.1,
                  }}
                >
                  {currentTitle}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#64748b", mt: 0.2 }}
                >
                  {currentSectionText}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center">
              <Chip
                label={primaryRole}
                variant="outlined"
                size="small"
                sx={{ display: { xs: "none", sm: "inline-flex" }, ...topbarRoleChipSx() }}
              />

              <Box
                component="button"
                type="button"
                onClick={handleOpenUserMenu}
                sx={topbarUserButtonSx(isUserMenuOpen)}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: 14,
                    fontWeight: 900,
                    backgroundColor: alpha("#0f172a", 0.08),
                    color: "#0f172a",
                  }}
                >
                  {userInitial}
                </Avatar>

                <Box
                  sx={{
                    display: { xs: "none", sm: "block" },
                    textAlign: "left",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 13.5,
                      color: "#0f172a",
                      lineHeight: 1.1,
                    }}
                    noWrap
                  >
                    {displayName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#64748b",
                      mt: 0.2,
                      lineHeight: 1.1,
                    }}
                    noWrap
                  >
                    {user?.email ?? "Sin correo"}
                  </Typography>
                </Box>

                <KeyboardArrowDownRoundedIcon
                  fontSize="small"
                  sx={{ color: "#64748b" }}
                />
              </Box>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={userMenuAnchorEl}
        open={isUserMenuOpen}
        onClose={handleCloseUserMenu}
        PaperProps={{ sx: userMenuPaperSx() }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 1 }}>
          <Box
            sx={{
              px: 1.25,
              pt: 1.15,
              pb: 1.25,
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  fontWeight: 900,
                  backgroundColor: alpha("#0f172a", 0.08),
                  color: "#0f172a",
                }}
              >
                {userInitial}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ fontWeight: 900, fontSize: 14.5, color: "#0f172a" }}
                  noWrap
                >
                  {displayName}
                </Typography>
                <Typography
                  sx={{ fontSize: 12.5, color: "#64748b" }}
                  noWrap
                >
                  {user?.email ?? "Sin correo"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
              <Chip
                size="small"
                label={primaryRole}
                variant="outlined"
                sx={topbarRoleChipSx()}
              />
            </Stack>
          </Box>

          <Divider sx={{ borderColor: alpha("#0f172a", 0.06) }} />

          <MenuItem onClick={handleGoToChangePassword} sx={userMenuActionSx()}>
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