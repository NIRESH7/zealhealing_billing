import React from 'react';
import { BarChart2, Download } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <BarChart2 className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Reports</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          View and download detailed billing reports. This module will allow you to filter by date range, product, and staff performance.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Monthly CSV
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            Generate Yearly PDF
          </button>
        </div>
      </div>
    </div>
  );
}
