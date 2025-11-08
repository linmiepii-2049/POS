import { ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * 表格欄位定義
 */
export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean;
}

/**
 * 表格屬性
 */
export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  rowKey?: keyof T | ((record: T) => string);
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

/**
 * 通用表格元件
 */
export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = '暫無資料',
  className,
  rowKey = 'id',
  sortBy,
  sortDir,
  onSort,
}: TableProps<T>) {
  /**
   * 取得行鍵值
   */
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] || index);
  };

  if (loading) {
    return (
      <div className={clsx('bg-white rounded-lg shadow overflow-hidden', className)}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  // 只有在非加載狀態且數據為空時才顯示空狀態
  if (!loading && (!Array.isArray(data) || data.length === 0)) {
    return (
      <div className={clsx('bg-white rounded-lg shadow overflow-hidden', className)}>
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📄</div>
          <p className="text-gray-500">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white rounded-lg shadow overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* 表頭 */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.sortable && onSort ? 'cursor-pointer hover:bg-gray-100' : '',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable && onSort ? () => {
                    const newDir = sortBy === column.key && sortDir === 'asc' ? 'desc' : 'asc';
                    onSort(column.key, newDir);
                  } : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && onSort && (
                      <div className="flex flex-col">
                        <svg
                          className={clsx(
                            'w-3 h-3',
                            sortBy === column.key && sortDir === 'asc' ? 'text-gray-900' : 'text-gray-400'
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg
                          className={clsx(
                            'w-3 h-3 -mt-1',
                            sortBy === column.key && sortDir === 'desc' ? 'text-gray-900' : 'text-gray-400'
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* 表身 */}
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(data) ? data.map((record, index) => (
              <tr key={getRowKey(record, index)} className="hover:bg-gray-50">
                {columns.map((column) => {
                  const value = record[column.key];
                  return (
                    <td
                      key={column.key}
                      className={clsx(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, record, index) : value}
                    </td>
                  );
                })}
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
