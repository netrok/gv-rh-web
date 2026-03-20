import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";

type HeroBannerProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
};

export default function HeroBanner({
  eyebrow,
  title,
  subtitle,
  badge,
  icon,
  aside,
  actions,
}: HeroBannerProps) {
  const hasFooterActions = Boolean(badge || actions);

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        background: "linear-gradient(135deg, #0b1730 0%, #12264a 55%, #18335e 100%)",
        color: "#ffffff",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
        border: `1px solid ${alpha("#ffffff", 0.06)}`,
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        spacing={{ xs: 3, md: 4 }}
        alignItems={{ xs: "stretch", lg: "flex-start" }}
        sx={{ p: { xs: 3, md: 4 } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {icon ? (
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "16px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#ffffff", 0.10),
                  color: "#ffffff",
                  border: `1px solid ${alpha("#ffffff", 0.10)}`,
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
            ) : null}

            <Box sx={{ minWidth: 0, flex: 1 }}>
              {eyebrow ? (
                <Typography
                  variant="overline"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    letterSpacing: "0.12em",
                    color: alpha("#ffffff", 0.78),
                    fontWeight: 800,
                  }}
                >
                  {eyebrow}
                </Typography>
              ) : null}

              <Typography
                variant="h3"
                sx={{
                  mt: eyebrow ? 1 : 0,
                  fontWeight: 900,
                  fontSize: { xs: "2rem", md: "2.8rem" },
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  maxWidth: 820,
                }}
              >
                {title}
              </Typography>

              {subtitle ? (
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1.5,
                    color: alpha("#ffffff", 0.84),
                    maxWidth: 760,
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}

              {hasFooterActions ? (
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 2.25 }}
                >
                  {badge ? (
                    <Chip
                      label={badge}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: "#ffffff",
                        borderColor: alpha("#ffffff", 0.18),
                        bgcolor: alpha("#ffffff", 0.08),
                        fontWeight: 800,
                      }}
                    />
                  ) : null}

                  {actions}
                </Stack>
              ) : null}
            </Box>
          </Stack>
        </Box>

        {aside ? (
          <Box
            sx={{
              minWidth: { xs: "100%", lg: 280 },
              maxWidth: { xs: "100%", lg: 340 },
              p: { xs: 2.25, md: 2.5 },
              borderRadius: "22px",
              bgcolor: alpha("#ffffff", 0.08),
              border: `1px solid ${alpha("#ffffff", 0.10)}`,
            }}
          >
            {aside}
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
}