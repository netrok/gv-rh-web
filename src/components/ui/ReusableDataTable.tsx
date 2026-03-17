import type { ReactNode } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  GridRowId,
  GridValidRowModel,
} from "@mui/x-data-grid";
import EmptyState from "./EmptyState";

type ReusableDataTableProps<TRow extends GridValidRowModel> = {
  title?: string;
  subtitle?: string;
  rows: TRow[];
  columns: GridColDef<TRow>[];
  loading?: boolean;
  getRowId?: (row: TRow) => GridRowId;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  minHeight?: number;
  maxHeight?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
};

export default function ReusableDataTable<TRow extends GridValidRowModel>({
  title,
  subtitle,
  rows,
  columns,
  loading = false,
  getRowId,
  toolbar,
  emptyTitle = "Sin registros",
  emptyMessage = "Todavía no hay elementos capturados.",
  emptyAction,
  minHeight = 300,
  maxHeight = 560,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
}: ReusableDataTableProps<TRow>) {
  const hasRows = rows.length > 0;
  const hasTextHeader = Boolean(title || subtitle);
  const hasToolbar = Boolean(toolbar);
  const showHeader = hasTextHeader || hasToolbar;

  const visibleRows = Math.min(rows.length || 1, initialPageSize);
  const calculatedHeight = Math.min(
    Math.max(visibleRows * 48 + 92, minHeight),
    maxHeight
  );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "#dfe3ea",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      {showHeader && (
        <>
          <CardContent
            sx={{
              px: 2,
              py: hasTextHeader ? 2 : 1.5,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent={hasTextHeader ? "space-between" : "flex-start"}
              alignItems={{ xs: "stretch", md: "center" }}
              gap={1.5}
            >
              {hasTextHeader ? (
                <Box>
                  {title ? (
                    <Typography
                      sx={{
                        fontSize: "1.15rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        lineHeight: 1.2,
                      }}
                    >
                      {title}
                    </Typography>
                  ) : null}

                  {subtitle ? (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: "text.secondary",
                      }}
                    >
                      {subtitle}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}

              {hasToolbar ? (
                <Box
                  sx={{
                    width: { xs: "100%", md: hasTextHeader ? "auto" : "100%" },
                    display: "flex",
                    justifyContent: hasTextHeader ? "flex-end" : "space-between",
                  }}
                >
                  {toolbar}
                </Box>
              ) : null}
            </Stack>
          </CardContent>

          <Divider />
        </>
      )}

      {loading && <LinearProgress />}

      <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
        {!hasRows && loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ minHeight: 220 }}
          >
            <CircularProgress size={30} />
            <Typography variant="body2" color="text.secondary">
              Cargando información...
            </Typography>
          </Stack>
        ) : !hasRows ? (
          <EmptyState
            title={emptyTitle}
            description={emptyMessage}
            action={emptyAction}
          />
        ) : (
          <Box sx={{ width: "100%", height: calculatedHeight }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={getRowId}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={pageSizeOptions}
              rowHeight={48}
              columnHeaderHeight={46}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: initialPageSize,
                    page: 0,
                  },
                },
              }}
              sx={{
                border: 0,
                bgcolor: "transparent",
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "#fff",
                  borderBottom: "1px solid #e5e7eb",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 800,
                  color: "#0f172a",
                  fontSize: 13,
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #eef2f7",
                  fontSize: 14,
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "#fafcff",
                },
                "& .MuiDataGrid-footerContainer": {
                  minHeight: 46,
                  borderTop: "1px solid #e5e7eb",
                  bgcolor: "#fff",
                },
                "& .MuiDataGrid-selectedRowCount": {
                  visibility: "hidden",
                },
                "& .MuiDataGrid-columnSeparator": {
                  display: "none",
                },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                  outline: "none",
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Card>
  );
}