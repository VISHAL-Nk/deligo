'use client';

import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    summary?: { successful: number; failed: number };
    errors?: Array<{ row: number; message: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      'name',
      'description',
      'sku',
      'price',
      'discount',
      'stock',
      'categoryId',
      'status',
      'lowStockThreshold',
    ];
    const sampleRow = [
      'Sample Product',
      'This is a sample product description',
      'SKU-001',
      '999',
      '50',
      '100',
      'your-category-id',
      'active',
      '10',
    ];

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/seller/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error uploading file:', error);
      setResult({
        success: false,
        message: 'Failed to upload file',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/seller/products"
            className="text-green-600 hover:text-green-700 font-semibold mb-4 inline-block"
          >
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
          <p className="text-gray-600 mt-1">Upload multiple products at once using CSV or Excel files</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to use Bulk Upload:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Download the template CSV file below</li>
            <li>Fill in your product details following the format</li>
            <li>Make sure all required fields are filled (name, sku, price, categoryId)</li>
            <li>Upload the completed file</li>
            <li>Review the results and fix any errors if needed</li>
          </ol>
        </div>

        {/* Template Download */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">CSV Template</h3>
                <p className="text-sm text-gray-600">Download the template to get started</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
            {file ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <div>
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? 'Uploading...' : 'Upload Products'}
                  </button>
                  <button
                    onClick={() => setFile(null)}
                    disabled={uploading}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">CSV or XLSX files only</p>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`rounded-lg shadow-sm p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Upload Successful!' : 'Upload Failed'}
                </h3>
                <p className={`text-sm mb-4 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                
                {result.summary && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">
                        {result.summary.successful} products uploaded successfully
                      </span>
                    </div>
                    {result.summary.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-800">
                          {result.summary.failed} products failed
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {result.errors.slice(0, 10).map((error, idx: number) => (
                        <li key={idx}>
                          Row {error.row}: {error.message}
                        </li>
                      ))}
                      {result.errors.length > 10 && (
                        <li className="text-red-600">... and {result.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}

                {result.success && (
                  <Link
                    href="/seller/products"
                    className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Products
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Field Reference */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Field Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Field</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Required</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">name</td>
                  <td className="py-2 px-4"><span className="text-red-600">Yes</span></td>
                  <td className="py-2 px-4 text-gray-600">Product name</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">description</td>
                  <td className="py-2 px-4"><span className="text-red-600">Yes</span></td>
                  <td className="py-2 px-4 text-gray-600">Product description</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">sku</td>
                  <td className="py-2 px-4"><span className="text-red-600">Yes</span></td>
                  <td className="py-2 px-4 text-gray-600">Unique SKU code</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">price</td>
                  <td className="py-2 px-4"><span className="text-red-600">Yes</span></td>
                  <td className="py-2 px-4 text-gray-600">Product price in rupees</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">discount</td>
                  <td className="py-2 px-4">No</td>
                  <td className="py-2 px-4 text-gray-600">Discount amount (default: 0)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">stock</td>
                  <td className="py-2 px-4"><span className="text-red-600">Yes</span></td>
                  <td className="py-2 px-4 text-gray-600">Available stock quantity</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">categoryId</td>
                  <td className="py-2 px-4"><span className="text-red-600">Yes</span></td>
                  <td className="py-2 px-4 text-gray-600">Category MongoDB ID</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">status</td>
                  <td className="py-2 px-4">No</td>
                  <td className="py-2 px-4 text-gray-600">active or inactive (default: active)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 font-mono text-xs">lowStockThreshold</td>
                  <td className="py-2 px-4">No</td>
                  <td className="py-2 px-4 text-gray-600">Low stock alert level (default: 10)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
