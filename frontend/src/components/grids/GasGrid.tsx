import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

interface GasInfo {
  chainName: string;
  currentBalance: string;
  totalDeposited: string;
  currentBalanceUSD: number;
  totalDepositedUSD: number;
}

interface GasGridProps {
  gasInfo: Record<string, GasInfo>;
  selectedChain?: string;
}

export const GasGrid: React.FC<GasGridProps> = ({ gasInfo }) => {
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
        field: "chainName",
        headerName: "Chain",
        flex: 1,
      },
      {
        field: "currentBalance",
        headerName: "Current Balance (NATIVE)",
        flex: 1,
        type: "numericColumn",
        valueFormatter: (params: any) =>
          Number(params.value).toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8,
          }),
      },
      {
        field: "currentBalanceUSD",
        headerName: "Current Balance (USD)",
        flex: 1,
        type: "numericColumn",
        valueFormatter: (params: any) =>
          Number(params.value).toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          }),
      },
      {
        field: "totalDeposited",
        headerName: "Total Deposited (ETH)",
        flex: 1,
        type: "numericColumn",
        valueFormatter: (params: any) =>
          Number(params.value).toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8,
          }),
      },
      {
        field: "totalDepositedUSD",
        headerName: "Total Deposited (USD)",
        flex: 1,
        type: "numericColumn",
        valueFormatter: (params: any) =>
          Number(params.value).toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          }),
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

  const rowData = useMemo(() => {
    return Object.entries(gasInfo).map(([chainId, info]) => ({
      chainId,
      ...info,
    }));
  }, [gasInfo]);

  return (
    <div className="w-full h-[335px] bg-vercel-card-background border border-vercel-border rounded-lg overflow-hidden">
      <div style={gridStyle}>
        <AgGridReact
          theme={vercelTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          enableCellTextSelection={true}
          suppressCellFocus={true}
          domLayout="normal"
          columnHoverHighlight={true}
          columnMenu="new"
        />
      </div>
    </div>
  );
};
