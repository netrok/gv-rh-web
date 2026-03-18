import type { ReactNode } from "react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const drawerWidth = 248;
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
    ...new Set(
      (roles ?? []).map((r) => r.trim().toUpperCase()).filter(Boolean)
    ),
  ];
}

function canAccess(userRoles: string[], allowedRoles?: string[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role.toUpperCase()));
}

export default function AppShell() {
  const { logout, roles = [] } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedRoles = normalizeRoles(roles);

  const visibleMenuItems = menuItems.filter((item) =>
    canAccess(normalizedRoles, item.allow)
  );

  const currentTitle =
    menuItems.find(
      (x) =>
        location.pathname === x.to ||
        location.pathname.startsWith(`${x.to}/`)
    )?.label ?? "GV RH";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: appBarHeight,
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          justifyContent: "center",
          backgroundColor: "#ffffff",
          color: "#111827",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${appBarHeight}px !important`,
            px: { xs: 2, md: 3 },
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ color: "#6b7280", mb: 0.25 }}>
              Sistema interno
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {currentTitle}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => {
              void logout();
            }}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              px: 2,
            }}
          >
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
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
        <Box sx={{ px: 3, py: 2.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(255,255,255,0.08)",
              mb: 1.5,
            }}
          >
            <ShieldRoundedIcon />
          </Box>

          <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
            GV RH
          </Typography>

          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Administración
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <List sx={{ px: 1.5, py: 1.5 }}>
          {visibleMenuItems.map((item) => {
            const selected =
              location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);

            return (
              <ListItemButton
                key={item.to}
                selected={selected}
                onClick={() => navigate(item.to)}
                sx={{
                  minHeight: 48,
                  borderRadius: 3,
                  mb: 0.75,
                  px: 1.5,
                  color: selected ? "#ffffff" : "#cbd5e1",
                  backgroundColor: selected
                    ? "rgba(255,255,255,0.10)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: selected
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(255,255,255,0.06)",
                  },
                  "& .MuiListItemIcon-root": {
                    minWidth: 36,
                    color: selected ? "#ffffff" : "#94a3b8",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: selected ? 700 : 600,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: `${drawerWidth}px`,
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