import type { ReactNode } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Card,
  CardActionArea,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

type ActionTileProps = {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  to?: string;
  onClick?: () => void;
};

export default function ActionTile({
  title,
  subtitle,
  description,
  icon,
  to,
  onClick,
}: ActionTileProps) {
  const navigate = useNavigate();
  const supportingText = subtitle ?? description;
  const isClickable = Boolean(to || onClick);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  };

  const content = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{
        px: 2.25,
        py: 2,
        minHeight: 96,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ minWidth: 0, flex: 1 }}
      >
        {icon ? (
          <Box
            className="gv-action-tile-icon"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              color: "primary.main",
              border: (theme) =>
                `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              flexShrink: 0,
              transition:
                "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
            }}
          >
            {icon}
          </Box>
        ) : null}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            className="gv-action-tile-title"
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              lineHeight: 1.2,
              transition: "color 180ms ease",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>

          {supportingText ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.35,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {supportingText}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      {isClickable ? (
        <ChevronRightRoundedIcon
          className="gv-action-tile-arrow"
          sx={{
            color: (theme) => alpha(theme.palette.text.primary, 0.42),
            flexShrink: 0,
            transition: "transform 180ms ease, color 180ms ease",
          }}
        />
      ) : null}
    </Stack>
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "18px",
        border: (theme) =>
          `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
        backgroundImage: "none",
        overflow: "hidden",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
    >
      {isClickable ? (
        <CardActionArea
          onClick={handleClick}
          sx={{
            borderRadius: "18px",
            transition: "background-color 180ms ease",
            "&:hover": {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
            },
            "&:hover .gv-action-tile-arrow": {
              transform: "translateX(3px)",
              color: "primary.main",
            },
            "&:hover .gv-action-tile-icon": {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
            },
            "&:hover .gv-action-tile-title": {
              color: "text.primary",
            },
            "&.Mui-focusVisible": {
              outline: (theme) =>
                `3px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              outlineOffset: "-3px",
            },
          }}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}