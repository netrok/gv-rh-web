import type { ReactNode } from "react";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Box, Button, Stack, Typography } from "@mui/material";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title = "Sin información",
  description = "Aún no hay datos para mostrar.",
  icon,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const actionNode =
    action ?? (actionLabel && onAction ? (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: 260,
        py: 6,
        px: 3,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          color: "text.secondary",
          opacity: 0.75,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon ?? <InboxRoundedIcon sx={{ fontSize: 54 }} />}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 520 }}
      >
        {description}
      </Typography>

      {actionNode ? <Box sx={{ pt: 1 }}>{actionNode}</Box> : null}
    </Stack>
  );
}