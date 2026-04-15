(function (global) {
  'use strict';

  function compareIds(a, b) {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') {
      return na - nb;
    }
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  function getId(row, idKey) {
    if (typeof idKey === 'function') return idKey(row);
    return row[idKey];
  }

  /**
   * @param {Array} rows
   * @param {string} mode default | asc | desc | name
   * @param {{ idKey: string|function, nameKey: string }} cfg
   */
  function sortRows(rows, mode, cfg) {
    if (!rows || !mode || mode === 'default') return rows.slice();
    const copy = rows.slice();
    const { idKey, nameKey } = cfg;
    if (mode === 'name' && nameKey) {
      copy.sort((x, y) =>
        String(x[nameKey] ?? '').localeCompare(String(y[nameKey] ?? ''), undefined, { sensitivity: 'base' })
      );
      return copy;
    }
    if (mode === 'asc') {
      copy.sort((x, y) => compareIds(getId(x, idKey), getId(y, idKey)));
      return copy;
    }
    if (mode === 'desc') {
      copy.sort((x, y) => compareIds(getId(y, idKey), getId(x, idKey)));
      return copy;
    }
    return copy;
  }

  function cellValue(row, col) {
    if (typeof col.accessor === 'function') return col.accessor(row);
    return row[col.key];
  }

  function exportCsv(columns, rows, filename) {
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [columns.map((c) => esc(c.header)).join(',')];
    rows.forEach((r) => {
      lines.push(columns.map((c) => esc(cellValue(r, c))).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPdf(title, columns, rows, filename) {
    if (!global.jspdf || !global.jspdf.jsPDF) {
      if (typeof global.showToast === 'function') global.showToast('PDF library not loaded', 'error');
      return;
    }
    const { jsPDF } = global.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    const head = [columns.map((c) => c.header)];
    const body = rows.map((r) => columns.map((c) => String(cellValue(r, c) ?? '')));
    doc.autoTable({
      head,
      body,
      startY: 22,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(filename);
  }

  /**
   * @param {{ getRows: function(): Array, columns: Array, baseFilename: string, pdfTitle?: string }} config
   */
  function wireExportButtons(config) {
    const { getRows, columns, baseFilename, pdfTitle } = config;
    const csvBtn = document.getElementById('exportCsvBtn');
    const pdfBtn = document.getElementById('exportPdfBtn');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const rows = getRows();
        exportCsv(columns, rows, `${baseFilename}.csv`);
      });
    }
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        const rows = getRows();
        exportPdf(pdfTitle || baseFilename, columns, rows, `${baseFilename.replace(/[^a-z0-9-_]/gi, '_')}.pdf`);
      });
    }
  }

  global.TableTools = {
    sortRows,
    exportCsv,
    exportPdf,
    wireExportButtons
  };
})(typeof window !== 'undefined' ? window : this);
