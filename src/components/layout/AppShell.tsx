import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../../features/auth/AuthContext";

const drawerWidth = 240;

const menuItems = [
  { label: "Auditoría", to: "/audit" },
  { label: "Departamentos", to: "/departamentos" },
  { label: "Puestos", to: "/puestos" },
  { label: "Empleados", to: "/empleados" },
];

export default function AppShell() {
  const { logout } = useAuth();
  const location = useLocation();

  const currentTitle =
    menuItems.find((x) => location.pathname.startsWith(x.to))?.label ?? "GV RH";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f7fb" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: "#fff",
          color: "#111827",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {currentTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gran Vía RH
            </Typography>
          </Box>

          <Button variant="outlined" color="inherit" onClick={logout}>
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
            backgroundColor: "#111827",
            color: "#f9fafb",
            borderRight: "none",
          },
        }}
      >
        <Toolbar>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              GV RH
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              Administración
            </Typography>
          </Box>
        </Toolbar>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <List sx={{ px: 1, py: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: "#e5e7eb",
                "&.active": {
                  backgroundColor: "#1f2937",
                  color: "#fff",
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px` }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}