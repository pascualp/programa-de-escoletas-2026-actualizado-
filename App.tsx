import React, { useState, useRef, useCallback } from 'react';
import { COLUMNS, INITIAL_DATA } from './constants';
import { DataTable } from './components/DataTable';
import { Toast } from './components/Toast';
import { Product } from './types';

export const App: React.FC = () => {
  const [data, setData] = useState<Product[]>(INITIAL_DATA);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [copiedColumns, setCopiedColumns] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string, isError = false) => {
    setFeedback({ message, isError });
    if (!isError) setTimeout(() => setFeedback(null), 5000);
  }, []);

  const normalize = (val: any) => {
    if (val === null || val === undefined) return "";
    return String(val).trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, ' ');
  };

  const handleCellChange = useCallback((rowIndex: number, colKey: string, value: string) => {
    setData(prev => {
      const newData = [...prev];
      const targetRow = { ...newData[rowIndex] };
      if (['code', 'name', 'unit'].includes(colKey)) {
        (targetRow as any)[colKey] = value;
      } else {
        targetRow.locations = { ...targetRow.locations, [colKey]: value };
      }
      newData[rowIndex] = targetRow;
      return newData;
    });
  }, []);

  const clearAllLocations = useCallback(() => {
    setData(prev => prev.map(row => ({ ...row, locations: {} })));
    setCopiedColumns(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
    notify("Cantidades limpiadas.");
  }, [notify]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const XLSX = (window as any).XLSX;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (jsonData.length === 0) return notify("Archivo vacío.", true);

        setData(prev => {
          const newData = prev.map(item => ({ ...item, locations: { ...item.locations } }));
          let matchCount = 0;
          let colMapping: { [key: string]: number } = {};

          // Detección de cabeceras
          for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
            const row = jsonData[i] || [];
            const rowNorm = Array.from(row).map(c => normalize(c));
            if (rowNorm.some(c => c && (c.includes("COD") || c.includes("ART") || c.includes("PROD")))) {
              COLUMNS.slice(3).forEach(col => {
                const keyword = normalize(col.label).split(' ')[0];
                const foundIdx = rowNorm.findIndex(c => c && c.includes(keyword));
                if (foundIdx !== -1) colMapping[col.key] = foundIdx;
              });
            }
          }

          // Procesamiento con Escaneo Profundo
          jsonData.forEach((row) => {
            if (!row || row.length === 0) return;
            let targetIdx = -1;
            const searchRange = Math.min(row.length, 25);
            for (let c = 0; c < searchRange; c++) {
              const cellVal = normalize(row[c]);
              if (!cellVal) continue;
              targetIdx = newData.findIndex(p => {
                const pCode = normalize(p.code);
                const pName = normalize(p.name);
                return (pCode === cellVal && pCode !== "") || (pName === cellVal && pName !== "") || (cellVal.length > 6 && pName.includes(cellVal));
              });
              if (targetIdx !== -1) break;
            }
            if (targetIdx !== -1) {
              matchCount++;
              COLUMNS.slice(3).forEach((col, colIdx) => {
                let val = (colMapping[col.key] !== undefined) ? String(row[colMapping[col.key]] || "").trim() : String(row[colIdx + 3] || "").trim();
                if (val !== "" && val !== "0" && val.toLowerCase() !== "undefined") {
                  // Normalize to comma for display
                  newData[targetIdx].locations[col.key] = val.replace('.', ',');
                }
              });
            }
          });

          if (matchCount > 0) notify(`Sincronizados ${matchCount} productos.`);
          else notify("No se encontraron coincidencias.", true);
          return newData;
        });
        setShowImport(false);
      } catch (err) { notify("Error al leer Excel.", true); }
    };
    reader.readAsArrayBuffer(file);
  };

  const calculateValue = (val: string, multiplier?: number) => {
    if (!multiplier || !val || val.trim() === '' || val.trim() === '0') return val.replace('.', ',');
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? val.replace('.', ',') : (num * multiplier).toFixed(2).replace('.', ',');
  };

  const copyFullTable = useCallback(() => {
    let tsv = COLUMNS.map(col => col.label).join('\t') + '\n';
    let count = 0;
    data.forEach(row => {
      if (Object.values(row.locations).some(v => v && v !== "" && v !== "0")) {
        count++;
        tsv += [row.code, row.name, row.unit, ...COLUMNS.slice(3).map(col => calculateValue(row.locations[col.key] || "", row.multiplier))].join('\t') + '\n';
      }
    });
    if (count === 0) return notify("Nada que copiar.", true);
    navigator.clipboard.writeText(tsv).then(() => notify(`Copiadas ${count} filas.`));
  }, [data, notify]);

  const copyColumn = useCallback((colKey: string) => {
    let tsv = ""; let count = 0;
    data.forEach(row => {
      const val = row.locations[colKey];
      if (val && val !== "" && val !== "0") { 
        count++; 
        tsv += `${row.code}\t${calculateValue(val, row.multiplier)}\n`; 
      }
    });
    if (count === 0) return notify("Columna vacía.", true);
    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedColumns(prev => new Set(prev).add(colKey));
      notify(`Copiado: ${COLUMNS.find(c=>c.key===colKey)?.label}`);
    });
  }, [data, notify]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg ring-1 ring-blue-400/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h5l2 3h9a2 2 0 0 1 2 2v10M11 20l4-4M11 20l4 4M11 20h11" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase leading-none italic">FRUITAS V9.0</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-[0.15em] uppercase mt-1">Deep Sync Motor</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(!showImport)} className="bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-700 transition-all">SUBIR EXCEL</button>
          <button onClick={clearAllLocations} className="bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none transition-all">LIMPIAR</button>
          <button onClick={copyFullTable} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-2.5 rounded-xl font-black text-xs shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all">COPIAR TODO</button>
        </div>
      </header>

      {feedback && <Toast {...feedback} onClose={() => setFeedback(null)} />}

      {showImport && (
        <div className="bg-white p-8 border-b-4 border-blue-100 animate-slideIn flex justify-center shadow-inner">
          <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-4 border-dashed border-slate-200 rounded-3xl p-12 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-center">
            <div className="inline-block p-4 bg-blue-600 rounded-2xl text-white mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2.5"/></svg></div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">Haz clic para cargar el pedido</h2>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest italic">Escaneo profundo habilitado (Cód/Nombre)</p>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto p-4 bg-slate-200/40">
        <DataTable 
          data={data} 
          columns={COLUMNS} 
          onCellChange={handleCellChange} 
          onCopyColumn={copyColumn} 
          calculateValue={calculateValue}
          copiedColumns={copiedColumns}
        />
      </main>

      <footer className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span>Sincronización Inteligente Activa</span></div>
        <div className="flex gap-4 text-slate-500"><span>{data.length} PRODUCTOS</span><span>V9.1.0 STABLE</span></div>
      </footer>
    </div>
  );
};
