import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type AppPageProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

function hasText(value?: string): boolean {
  return Boolean(value?.trim());
}

export default function AppPage({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: AppPageProps) {
  const showEyebrow = hasText(eyebrow);
  const showTitle = hasText(title);
  const showSubtitle = hasText(subtitle);
  const showHeader = showEyebrow || showTitle || showSubtitle || Boolean(actions);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 3,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: showHeader ? { xs: 3.5, md: 4.5 } : 0,
          minWidth: 0,
        }}
      >
        {showHeader ? (
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "flex-start" }}
            spacing={{ xs: 2, md: 2.75 }}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              {showEyebrow ? (
                <Typography
                  variant="overline"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    color: "text.secondary",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    lineHeight: 1.4,
                    mb: 0.9,
                  }}
                >
                  {eyebrow}
                </Typography>
              ) : null}

              {showTitle ? (
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "text.primary",
                    lineHeight: 1.12,
                    letterSpacing: "-0.02em",
                    maxWidth: 900,
                    textWrap: "balance",
                  }}
                >
                  {title}
                </Typography>
              ) : null}

              {showSubtitle ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    mt: showTitle ? 0.9 : 0,
                    maxWidth: 920,
                    lineHeight: 1.6,
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Box>

            {actions ? (
              <Box
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                  width: { xs: "100%", md: "auto" },
                  minWidth: 0,
                  pt: { xs: 0.25, md: 0 },
                }}
              >
                {actions}
              </Box>
            ) : null}
          </Stack>
        ) : null}

        <Box
          sx={{
            minWidth: 0,
            display: "grid",
            gap: { xs: 2.75, md: 3.25 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}