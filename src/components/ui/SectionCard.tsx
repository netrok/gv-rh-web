import type { ReactNode } from "react";
import { Box, Card, Divider, Stack, Typography } from "@mui/material";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <Card
      elevation={0}
      sx={{
        overflow: "hidden",
        backgroundImage: "none",
      }}
    >
      {hasHeader ? (
        <>
          <Box
            sx={{
              px: { xs: 1.75, md: 2.25 },
              py: { xs: 1.5, md: 1.75 },
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={{ xs: 1.25, sm: 1.5 }}
            >
              <Box
                sx={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {title ? (
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: "text.primary",
                      lineHeight: 1.15,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {title}
                  </Typography>
                ) : null}

                {subtitle ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: title ? 0.4 : 0,
                      lineHeight: 1.45,
                      maxWidth: { xs: "100%", md: "88%" },
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
                    gap: 0.75,
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                    pt: { xs: 0.15, sm: 0 },
                  }}
                >
                  {actions}
                </Box>
              ) : null}
            </Stack>
          </Box>

          <Divider />
        </>
      ) : null}

      <Box
        sx={{
          px: { xs: 1.75, md: 2.25 },
          py: { xs: 1.5, md: 1.9 },
        }}
      >
        {children}
      </Box>
    </Card>
  );
}