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

function hasText(value?: string): boolean {
  return Boolean(value?.trim());
}

export default function HeroBanner({
  eyebrow,
  title,
  subtitle,
  badge,
  icon,
  aside,
  actions,
}: HeroBannerProps) {
  const showEyebrow = hasText(eyebrow);
  const showSubtitle = hasText(subtitle);
  const showBadge = hasText(badge);
  const showFooterActions = showBadge || Boolean(actions);

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "14px",
        background:
          "linear-gradient(135deg, #0b1730 0%, #12264a 55%, #18335e 100%)",
        color: "#ffffff",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
        border: `1px solid ${alpha("#ffffff", 0.06)}`,
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        spacing={{ xs: 2.5, md: 3 }}
        alignItems={{ xs: "stretch", lg: "flex-start" }}
        sx={{ p: { xs: 2.5, md: 3 } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.75} alignItems="flex-start">
            {icon ? (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#ffffff", 0.1),
                  color: "#ffffff",
                  border: `1px solid ${alpha("#ffffff", 0.1)}`,
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
            ) : null}

            <Box sx={{ minWidth: 0, flex: 1 }}>
              {showEyebrow ? (
                <Typography
                  variant="overline"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    letterSpacing: "0.08em",
                    color: alpha("#ffffff", 0.78),
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {eyebrow}
                </Typography>
              ) : null}

              <Typography
                variant="h3"
                sx={{
                  mt: showEyebrow ? 0.75 : 0,
                  fontWeight: 900,
                  fontSize: { xs: "1.6rem", md: "2.1rem" },
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  maxWidth: 760,
                  textWrap: "balance",
                }}
              >
                {title}
              </Typography>

              {showSubtitle ? (
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1.25,
                    color: alpha("#ffffff", 0.84),
                    maxWidth: 720,
                    fontSize: { xs: "0.96rem", md: "1rem" },
                    lineHeight: 1.55,
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}

              {showFooterActions ? (
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 1.75 }}
                >
                  {showBadge ? (
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
              minWidth: { xs: "100%", lg: 260 },
              maxWidth: { xs: "100%", lg: 320 },
              p: { xs: 2, md: 2.25 },
              borderRadius: "14px",
              bgcolor: alpha("#ffffff", 0.08),
              border: `1px solid ${alpha("#ffffff", 0.1)}`,
            }}
          >
            {aside}
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
}