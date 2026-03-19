import type { ReactNode } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

type ActionTileProps = {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  to: string;
};

export default function ActionTile({
  title,
  subtitle,
  icon,
  to,
}: ActionTileProps) {
  const navigate = useNavigate();

  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardActionArea onClick={() => navigate(to)} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {icon ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    bgcolor: "action.hover",
                    color: "primary.main",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </Stack>
              ) : null}

              <div>
                <Typography variant="subtitle1" fontWeight={800}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </div>
            </Stack>

            <ChevronRightRoundedIcon color="action" />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}