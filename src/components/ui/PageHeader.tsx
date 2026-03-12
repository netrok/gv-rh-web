import { Box, Button, Stack, Typography } from "@mui/material";

type PageHeaderAction = {
  label: string;
  onClick: () => void;
  variant?: "text" | "outlined" | "contained";
  disabled?: boolean;
  startIcon?: React.ReactNode;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
};

export default function PageHeader({
  title,
  subtitle,
  actions = [],
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary">{subtitle}</Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1}>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? "contained"}
            onClick={action.onClick}
            disabled={action.disabled}
            startIcon={action.startIcon}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}