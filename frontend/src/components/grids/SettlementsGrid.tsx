import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

interface Settlement {
  orderId: string;
  amount: string;
  profit: string;
  timestamp: number;
  chainId: string;
  chainName: string;
}

interface SettlementsGridProps {
  settlements: Settlement[];
  selectedChain?: string;
}

export const SettlementsGrid: React.FC<SettlementsGridProps> = ({
  settlements,
  selectedChain,
}) => {
  const vercelTheme = themeQuartz.withParams({
    accentColor: "#FFFFFF",
    backgroundColor: "#111111",
    borderColor: "#333333",
    borderRadius: 8,
    browserColorScheme: "dark",
    cellHorizontalPaddingScale: 1,
    chromeBackgroundColor: {
      ref: "backgroundColor",
    },
    columnBorder: true,
    fontFamily: "inherit",
    fontSize: 14,
    foregroundColor: "#FFFFFF",
    headerBackgroundColor: "#191919",
    headerFontSize: 14,
    headerFontWeight: 500,
    headerTextColor: "#FFFFFF",
    rowHoverColor: "#191919",
    selectedRowBackgroundColor: "#191919",
    rowBorder: true,
    rowVerticalPaddingScale: 1.2,

    inputBackgroundColor: "#191919",

    spacing: 8,
    wrapperBorder: true,
    wrapperBorderRadius: 8,
  });

  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "orderId",
        headerName: "Order ID",
        flex: 1,
        cellRenderer: (params: any) => (
          <span
            className="cursor-pointer text-vercel-foreground hover:text-vercel-primary transition-colors"
            onClick={() => navigator.clipboard.writeText(params.value)}
            title="Click to copy full order ID"
          >
            {`${params.value.slice(0, 8)}...`}
          </span>
        ),
      },
      {
        field: "chainName",
        headerName: "Chain",
        flex: 1,
      },
      {
        field: "amount",
        headerName: "Amount (USDC)",
        flex: 1,
        type: "numericColumn",
        valueFormatter: (params: any) =>
          Number(params.value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          }),
      },
      {
        field: "profit",
        headerName: "Profit (USDC)",
        flex: 1,
        type: "numericColumn",
        valueFormatter: (params: any) =>
          Number(params.value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          }),
        cellClass: "text-vercel-success",
      },
      {
        field: "timestamp",
        headerName: "Date",
        flex: 1,
        valueFormatter: (params: any) =>
          new Date(params.value * 1000).toLocaleString(),
        sort: "desc",
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
    }),
    []
  );

  const filteredSettlements = useMemo(() => {
    if (!selectedChain) return settlements;
    return settlements.filter(settlement => settlement.chainId === selectedChain);
  }, [settlements, selectedChain]);

  if (!settlements || settlements.length === 0) {
    return (
      <div className="p-4 text-vercel-muted-foreground bg-vercel-card-background border border-vercel-border rounded-lg">
        No settlement data available
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-vercel-card-background border border-vercel-border rounded-lg overflow-hidden">
      <div style={gridStyle}>
        <AgGridReact
          theme={vercelTheme}
          rowData={filteredSettlements}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          enableCellTextSelection={true}
          pagination={true}
          paginationPageSize={20}
          suppressCellFocus={true}
          domLayout="normal"
          columnHoverHighlight={true}
          columnMenu="new"
        />
      </div>
    </div>
  );
};
