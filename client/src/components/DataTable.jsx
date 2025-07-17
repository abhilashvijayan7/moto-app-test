import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import DropdownWithCheckboxes from './DropdownWithCheckboxes';

const DataTable = ({
  columns,
  data = [],
  pageSizeOptions = [5, 10, 20],
  mode = 'client',         // 'client' | 'server'
  fetchData,               // Function for server mode
  totalRows = 0,           // Total rows for server mode
}) => {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.accessor));
  const [serverData, setServerData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Update visible columns when columns change
  useEffect(() => {
    if (columns.length > 0) {
      setVisibleColumns(columns.map(col => col.accessor));
    }
  }, [columns]);

  const toggleColumn = (accessor) => {
    setVisibleColumns(prev =>
      prev.includes(accessor)
        ? prev.filter(col => col !== accessor)
        : [...prev, accessor]
    );
  };

  const handleSort = (accessor) => {
    setCurrentPage(1);
    setSortConfig(prev => {
      if (prev.key === accessor) {
        if (prev.direction === 'asc') return { key: accessor, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key: accessor, direction: 'asc' };
    });
  };

  const filteredData = useMemo(() => {
    return data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = String(a[sortConfig.key] ?? '').toLowerCase();
        const bVal = String(b[sortConfig.key] ?? '').toLowerCase();
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const currentData = useMemo(() => {
    if (mode === 'server') return serverData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [mode, serverData, sortedData, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return mode === 'server'
      ? Math.ceil(totalRows / pageSize)
      : Math.ceil(filteredData.length / pageSize);
  }, [mode, totalRows, pageSize, filteredData.length]);

  // Fetch server data
  useEffect(() => {
    if (mode === 'server' && typeof fetchData === 'function') {
      setLoading(true);
      fetchData({
        page: currentPage,
        pageSize,
        search,
        sortKey: sortConfig.key,
        sortOrder: sortConfig.direction,
      }).then(result => {
        setServerData(result?.data || []);
      }).finally(() => setLoading(false));
    }
  }, [mode, fetchData, currentPage, pageSize, search, sortConfig]);

  // CSV Export
  const exportCSV = () => {
    const exportSource = mode === 'server' ? serverData : sortedData;
    const csvHeader = columns
      .filter(col => visibleColumns.includes(col.accessor))
      .map(col => `"${col.label}"`)
      .join(',');
    const csvRows = exportSource.map(row =>
      columns
        .filter(col => visibleColumns.includes(col.accessor))
        .map(col => `"${row[col.accessor] ?? ''}"`)
        .join(',')
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export
  const exportExcel = () => {
    const exportSource = mode === 'server' ? serverData : sortedData;
    const exportData = exportSource.map(row => {
      const rowData = {};
      columns
        .filter(col => visibleColumns.includes(col.accessor))
        .forEach(col => {
          rowData[col.label] = row[col.accessor] ?? '';
        });
      return rowData;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, 'data_export.xlsx');
  };

  return (
    <div className="space-y-4">

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="border rounded-md px-3 py-2 w-full md:w-1/3"
        />

        <DropdownWithCheckboxes
          buttonLabel="Select Columns"
          options={columns.map(col => ({
            value: col.accessor,
            label: col.label
          }))}
          selected={visibleColumns}
          onChange={setVisibleColumns}
        />

        <div className="flex flex-wrap items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border rounded-md px-3 py-2"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>

          <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded shadow">
            Export CSV
          </button>
          <button onClick={exportExcel} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow">
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-5 text-center">Loading...</div>
        ) : (
          <table className="min-w-max w-full table-auto text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500">
              <tr>
                {columns
                  .filter(col => visibleColumns.includes(col.accessor))
                  .map(col => {
                    const isSorted = sortConfig.key === col.accessor;
                    return (
                      <th
                        key={col.accessor}
                        onClick={() => handleSort(col.accessor)}
                        className="px-4 py-3 cursor-pointer select-none whitespace-nowrap"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{col.label}</span>
                          {isSorted && (
                            <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                    );
                  })}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                  {columns
                    .filter(col => visibleColumns.includes(col.accessor))
                    .map(col => (
                      <td key={col.accessor} className="px-4 py-2 whitespace-nowrap">
                        {row[col.accessor]}
                      </td>
                    ))}
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-4 text-gray-500">
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded bg-indigo-600 text-white disabled:bg-gray-300"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-2 rounded bg-indigo-600 text-white disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;
