import { Box, Card, CardContent, Typography } from "@mui/material";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary">
            Módulo en construcción.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}