import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type AppPageProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AppPage({
  eyebrow = "Sistema interno",
  title,
  subtitle,
  actions,
  children,
}: AppPageProps) {
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.5, fontWeight: 600 }}
          >
            {eyebrow}
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {title}
          </Typography>

          {subtitle ? (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actions ? <Box>{actions}</Box> : null}
      </Stack>

      {children}
    </Box>
  );
}