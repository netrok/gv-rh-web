import { useMemo, useState, type ReactNode } from "react";
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
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

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
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function buildNavItems(roles?: string[] | null): NavItem[] {
  const all: NavItem[] = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: <DashboardRoundedIcon />,
    },
    {
      label: "Usuarios",
      to: "/usuarios",
      icon: <PeopleAltRoundedIcon />,
      allow: ["ADMIN"],
    },
    {
      label: "Sucursales",
      to: "/sucursales",
      icon: <StoreRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Auditoría",
      to: "/audit",
      icon: <FactCheckRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Departamentos",
      to: "/departamentos",
      icon: <ApartmentRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Puestos",
      to: "/puestos",
      icon: <BadgeRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Empleados",
      to: "/empleados",
      icon: <Groups2RoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Incidencias",
      to: "/incidencias",
      icon: <EventBusyRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Vacantes",
      to: "/reclutamiento/vacantes",
      icon: <WorkOutlineRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
    {
      label: "Candidatos",
      to: "/reclutamiento/candidatos",
      icon: <PersonSearchRoundedIcon />,
      allow: ["ADMIN", "RRHH"],
    },
  ];

  return all.filter((item) => hasSomeRole(roles, item.allow));
}

function isRouteActive(pathname: string, to: string) {
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/usuarios")) return "Usuarios";
  if (pathname.startsWith("/sucursales")) return "Sucursales";
  if (pathname.startsWith("/audit")) return "Auditoría";
  if (pathname.startsWith("/departamentos")) return "Departamentos";
  if (pathname.startsWith("/puestos")) return "Puestos";
  if (pathname.startsWith("/empleados")) return "Empleados";
  if (pathname.startsWith("/incidencias")) return "Incidencias";
  if (pathname.startsWith("/reclutamiento/vacantes")) return "Vacantes";
  if (pathname.startsWith("/reclutamiento/candidatos")) return "Candidatos";
  return "GV RH";
}

function getPageSubtitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Vista general";
  if (pathname.startsWith("/reclutamiento")) return "Atracción de talento";
  return "Recursos Humanos";
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
  const navItems = buildNavItems(roles);
  const primaryRole = normalizeRoles(roles)[0] ?? "USUARIO";

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
            <Typography sx={{ fontSize: "1.75rem", fontWeight: 900, lineHeight: 1.1 }}>
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
              background: `linear-gradient(180deg, ${alpha("#ffffff", 0.06)} 0%, ${alpha(
                "#ffffff",
                0.035
              )} 100%)`,
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
        <List sx={{ p: 0, display: "grid", gap: 0.75 }}>
          {navItems.map((item) => {
            const active = isRouteActive(pathname, item.to);

            return (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={onNavigate}
                sx={{
                  minHeight: 52,
                  borderRadius: "12px",
                  px: 1.4,
                  color: "#fff",
                  border: `1px solid ${
                    active ? alpha("#ffffff", 0.16) : "transparent"
                  }`,
                  background: active
                    ? `linear-gradient(90deg, ${alpha("#1e3a8a", 0.36)} 0%, ${alpha(
                        "#1e40af",
                        0.16
                      )} 100%)`
                    : "transparent",
                  "&:hover": {
                    backgroundColor: alpha("#ffffff", 0.06),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? "#ffffff" : alpha("#ffffff", 0.82),
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "10px",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: active
                        ? alpha("#ffffff", 0.12)
                        : alpha("#ffffff", 0.06),
                      border: `1px solid ${alpha("#ffffff", active ? 0.12 : 0.06)}`,
                    }}
                  >
                    {item.icon}
                  </Box>
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
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
          })}
        </List>
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

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleCloseDrawer = () => {
    if (!isDesktop) setMobileOpen(false);
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
        <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 3 } }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 900, lineHeight: 1.1, color: "#0f172a" }}
            >
              {getPageTitle(location.pathname)}
            </Typography>

            <Typography variant="body2" sx={{ color: "#64748b" }}>
              {getPageSubtitle(location.pathname)}
            </Typography>
          </Box>

          {isDesktop && (
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
                onClick={(e) => setAccountAnchor(e.currentTarget)}
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
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
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
          )}
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
          pt: "72px",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3.5 } }}>{children ?? <Outlet />}</Box>
      </Box>
    </Box>
  );
}