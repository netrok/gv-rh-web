import type { ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

type PageAction = {
  label: string;
  onClick?: () => void;
  startIcon?: ReactNode;
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "inherit" | "success" | "error" | "warning";
  disabled?: boolean;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: PageAction[];
};

export default function PageHeader({
  title,
  subtitle,
  actions = [],
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 3,
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 2.5 },
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", lg: "center" }}
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", md: "2rem" },
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#0f172a",
            }}
          >
            {title}
          </Typography>

          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                mt: 0.75,
                color: "text.secondary",
                maxWidth: 720,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actions.length > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            sx={{
              width: { xs: "100%", lg: "auto" },
            }}
          >
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? "contained"}
                color={action.color ?? "primary"}
                startIcon={action.startIcon}
                onClick={action.onClick}
                disabled={action.disabled}
                size="medium"
                sx={{
                  minHeight: 42,
                  px: 2,
                  borderRadius: 999,
                  fontWeight: 700,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  boxShadow:
                    action.variant === "contained"
                      ? "0 6px 18px rgba(15, 23, 42, 0.12)"
                      : "none",
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}