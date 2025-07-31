import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import DropdownWithCheckboxes from './DropdownWithCheckboxes';

const DataTable = ({
  columns,
  data = [],
  pageSizeOptions = [5, 10, 20],
  totalRows = 0,
  defaultPageSize = 5,
  onExportCSV,
  onExportExcel,
  mode = 'client',
  fetchData = null,
  paginationClassName = 'flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4',
  paginationButtonClassName = 'px-4 py-2 text-sm font-medium text-white bg-[#208CD4] border border-[#208CD4] rounded-md hover:bg-[#1A73B0] focus:outline-none focus:ring-2 focus:ring-[#208CD4] disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] touch-manipulation',
}) => {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState(data);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Update visible columns when columns prop changes
  useEffect(() => {
    setVisibleColumns(columns.map(col => col.accessor));
  }, [columns]);

  // Fetch paginated data for server mode
  useEffect(() => {
    if (mode === 'server' && typeof fetchData === 'function') {
      setLoading(true);
      setProgress(0);

      // Simulate progress for fetching data
      const timer = setInterval(() => {
        setProgress(oldProgress => {
          if (oldProgress === 100) {
            clearInterval(timer);
            return 100;
          }
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 100);
        });
      }, 200);

      fetchData({ page: currentPage, pageSize })
        .then(({ data, totalCount }) => {
          setTableData(data);
          setProgress(100); // Ensure it completes
        })
        .finally(() => {
          setLoading(false);
          clearInterval(timer);
        });
    }
  }, [currentPage, pageSize, fetchData, mode]);

  const handleSort = (accessor) => {
    setSortConfig(prev => {
      if (prev.key === accessor) {
        if (prev.direction === 'asc') return { key: accessor, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key: accessor, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    if (mode === 'server') return tableData;

    return data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, tableData, search, mode]);

  const sortedData = useMemo(() => {
    if (mode === 'server') return filteredData;

    const sorted = [...filteredData];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = String(a[sortConfig.key] ?? '').toLowerCase();
        const bVal = String(b[sortConfig.key] ?? '').toLowerCase();
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }
    return sorted;
  }, [filteredData, sortConfig, mode]);

  const currentData = useMemo(() => {
    if (mode === 'server') return tableData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, tableData, currentPage, pageSize, mode]);

  const totalPages = useMemo(() => {
    if (mode === 'server') return Math.ceil(totalRows / pageSize);
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData, totalRows, pageSize, mode]);

  const exportCSV = () => {
    const csvHeader = columns
      .filter(col => visibleColumns.includes(col.accessor))
      .map(col => `"${col.label}"`)
      .join(',');

    const csvRows = currentData.map(row =>
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

  const exportExcel = () => {
    const exportData = currentData.map(row => {
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
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded-md px-3 py-2 w-full md:w-1/3 text-gray-700"
          disabled={mode === 'server'}
        />

        <DropdownWithCheckboxes
          buttonLabel="Select Columns"
          options={columns.map(col => ({
            value: col.accessor,
            label: col.label,
          }))}
          selected={visibleColumns}
          onChange={setVisibleColumns}
        />

        <div className="flex flex-col max-sm:w-full sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
          <button
            onClick={() => (onExportCSV ? onExportCSV() : exportCSV())}
            className="max-sm:w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!currentData.length}
          >
            Export CSV
          </button>
          <button
            onClick={() => (onExportExcel ? onExportExcel() : exportExcel())}
            className="max-sm:w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!currentData.length}
          >
            Export Excel
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="max-sm:w-full border rounded-md px-3 py-2 text-gray-700 max-sm:text-xs"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
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
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600 mb-4"></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Loading... {Math.round(progress)}%</p>
                  </div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="text-center py-4 text-gray-500">
                  No data found.
                </td>
              </tr>
            ) : (
              currentData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                  {columns
                    .filter(col => visibleColumns.includes(col.accessor))
                    .map(col => (
                      <td key={col.accessor} className="px-4 py-2 whitespace-nowrap">
                        {row[col.accessor]}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={paginationClassName}>
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className={paginationButtonClassName}
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={paginationButtonClassName}
        >
          Previous
        </button>
        <span className="text-sm max-sm:text-xs text-gray-700">Page {currentPage} of {totalPages || 1}</span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={paginationButtonClassName}
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={paginationButtonClassName}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default DataTable;