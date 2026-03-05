import React from 'react';
import { Column, Product } from '../types';

interface DataTableProps {
  data: Product[];
  columns: Column[];
  onCellChange: (rowIndex: number, colKey: string, value: string) => void;
  onCopyColumn: (colKey: string) => void;
  calculateValue: (val: string, multiplier?: number) => string;
  copiedColumns: Set<string>;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  columns, 
  onCellChange, 
  onCopyColumn, 
  calculateValue,
  copiedColumns
}) => (
  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
        <thead className="bg-slate-900 sticky top-0 z-20 text-white">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key} className={`${col.width} p-0 text-center border-r border-slate-800 last:border-0`}>
                <div className="py-5 px-2 flex flex-col items-center justify-between min-h-[110px]">
                  <span className={`text-[10px] font-black uppercase tracking-tight h-10 flex items-center text-center leading-tight ${idx < 3 ? 'text-slate-500' : 'text-white'}`}>
                    {col.label}
                  </span>
                  {idx >= 3 && (
                    <button 
                      onClick={() => onCopyColumn(col.key)} 
                      className={`${
                        copiedColumns.has(col.key) 
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_3px_0_rgb(5,150,105)]' 
                          : 'bg-blue-600 hover:bg-blue-500 shadow-[0_3px_0_rgb(29,78,216)]'
                      } text-white text-[9px] font-black py-2 px-3 rounded-xl active:translate-y-0.5 active:shadow-none transition-all uppercase`}
                    >
                      {copiedColumns.has(col.key) ? 'COPIADO ✓' : 'COPIAR + COD'}
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rIndex) => (
            <tr key={rIndex} className="hover:bg-blue-50/40 transition-colors group divide-x divide-slate-50">
              <td className="px-2 py-3 text-[11px] font-bold text-slate-300 text-center bg-slate-50/30">{row.code}</td>
              <td className="px-4 py-3 text-sm font-black text-slate-800 uppercase truncate group-hover:text-blue-600">{row.name}</td>
              <td className="px-2 py-3 text-[10px] text-slate-400 font-bold uppercase text-center bg-slate-50/50">
                {row.unit}
                {row.multiplier && <span className="block text-[9px] text-emerald-600 font-black mt-1">x {row.multiplier} KG</span>}
              </td>
              {columns.slice(3).map((col) => {
                const val = row.locations[col.key] || "";
                const total = calculateValue(val, row.multiplier);
                const hasVal = val.trim() !== "" && val !== "0";
                
                // Ensure value is displayed with comma
                const displayVal = val.replace('.', ',');

                return (
                  <td key={col.key} className={`p-0 relative transition-all ${hasVal ? 'bg-blue-50/60' : ''}`}>
                    <input
                      type="text"
                      value={displayVal}
                      onChange={(e) => {
                        // Allow both dot and comma in input, but we'll normalize it
                        const newVal = e.target.value.replace('.', ',');
                        onCellChange(rIndex, col.key, newVal);
                      }}
                      className={`w-full h-full min-h-[56px] p-2 text-center text-sm font-black bg-transparent border-0 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${hasVal ? 'text-blue-700' : 'text-slate-300'}`}
                      placeholder="-"
                    />
                    {row.multiplier && hasVal && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-black text-white bg-emerald-500 rounded-md shadow-sm pointer-events-none">{total}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
