import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({
  title = "Sin información",
  description = "Aún no hay datos para mostrar.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: 260,
        textAlign: "center",
        px: 3,
      }}
    >
      <Box sx={{ opacity: 0.7 }}>
        {icon ?? <InboxRoundedIcon sx={{ fontSize: 54 }} />}
      </Box>

      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
        {description}
      </Typography>

      {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
    </Stack>
  );
}