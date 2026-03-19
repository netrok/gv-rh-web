import type { ReactNode } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

type MetricCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
}: MetricCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mt: 0.75, lineHeight: 1 }}
            >
              {value}
            </Typography>

            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          <Stack alignItems="flex-end" spacing={1}>
            {badge ? (
              <Chip size="small" label={badge} color="primary" variant="outlined" />
            ) : null}

            {icon ? (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "action.hover",
                  color: "text.secondary",
                }}
              >
                {icon}
              </Box>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}