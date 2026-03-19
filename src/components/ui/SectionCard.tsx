import type { ReactNode } from "react";
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

type SectionCardProps = {
  title: string;
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
  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          {actions ? <Box>{actions}</Box> : null}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {children}
      </CardContent>
    </Card>
  );
}