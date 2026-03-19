import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

type HeroBannerProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  aside?: ReactNode;
  actions?: ReactNode;
};

export default function HeroBanner({
  eyebrow,
  title,
  subtitle,
  badge,
  aside,
  actions,
}: HeroBannerProps) {
  return (
    <Card
      sx={{
        overflow: "hidden",
        borderRadius: 6,
        background:
          "linear-gradient(135deg, #0b1630 0%, #14233f 48%, #1d2c49 100%)",
        color: "#ffffff",
        border: "none",
        boxShadow: "0 18px 44px rgba(10, 22, 48, 0.24)",
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          spacing={3}
        >
          <Box sx={{ flex: 1 }}>
            {eyebrow ? (
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 1.1,
                  color: alpha("#ffffff", 0.84),
                  fontWeight: 800,
                }}
              >
                {eyebrow}
              </Typography>
            ) : null}

            <Typography
              variant="h3"
              sx={{
                mt: 1,
                fontWeight: 900,
                fontSize: { xs: 34, md: 48 },
                lineHeight: 1.05,
                letterSpacing: -1,
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

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
              {badge ? (
                <Chip
                  label={badge}
                  size="small"
                  sx={{
                    color: "#ffffff",
                    borderColor: alpha("#ffffff", 0.22),
                    bgcolor: alpha("#ffffff", 0.08),
                    fontWeight: 800,
                  }}
                  variant="outlined"
                />
              ) : null}

              {actions}
            </Stack>
          </Box>

          {aside ? (
            <Box
              sx={{
                minWidth: { xs: "100%", lg: 270 },
                maxWidth: 320,
                p: 2.5,
                borderRadius: 5,
                bgcolor: alpha("#ffffff", 0.1),
                border: `1px solid ${alpha("#ffffff", 0.12)}`,
                backdropFilter: "blur(8px)",
              }}
            >
              {aside}
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}