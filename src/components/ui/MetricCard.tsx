import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";

type MetricCardProps = {
  title?: string;
  label?: string;
  value: ReactNode;
  subtitle?: string;
  helperText?: string;
  icon?: ReactNode;
  badge?: string;
};

export default function MetricCard({
  title,
  label,
  value,
  subtitle,
  helperText,
  icon,
  badge,
}: MetricCardProps) {
  const heading = title ?? label ?? "";
  const supportingText = subtitle ?? helperText;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
        border: (theme) =>
          `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
        backgroundColor: "#ffffff",
        backgroundImage: "none",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: (theme) =>
            `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{
          p: { xs: 2.25, md: 2.75 },
          minHeight: 152,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {heading ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 700,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {heading}
            </Typography>
          ) : null}

          <Typography
            variant="h4"
            sx={{
              mt: 1.1,
              fontWeight: 800,
              color: "text.primary",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontSize: { xs: "1.85rem", md: "2rem" },
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>

          {supportingText ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1.15,
                lineHeight: 1.45,
                maxWidth: "95%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {supportingText}
            </Typography>
          ) : null}
        </Box>

        {(badge || icon) && (
          <Stack alignItems="flex-end" spacing={1.1} sx={{ flexShrink: 0 }}>
            {badge ? (
              <Chip
                size="small"
                label={badge}
                variant="outlined"
                sx={{
                  fontWeight: 800,
                  color: "primary.main",
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.18),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                }}
              />
            ) : null}

            {icon ? (
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  color: "primary.main",
                  border: (theme) =>
                    `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: (theme) =>
                    `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.65)}`,
                }}
              >
                {icon}
              </Box>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}