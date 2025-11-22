

'use client';

import { useState, useEffect } from 'react';
import { Store, Building2, CreditCard, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StoreData {
  name: string;
  address: string;
}

interface FormData {
  businessName: string;
  gstNumber: string;
  panNumber: string;
  bankDetails: {
    accountMasked: string;
    ifsc: string;
    bankName: string;
  };
  store: StoreData[];
}

export default function SellerApplicationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<number | null>(null);
  const [rejectedReason, setRejectedReason] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    gstNumber: '',
    panNumber: '',
    bankDetails: {
      accountMasked: '',
      ifsc: '',
      bankName: '',
    },
    store: [{ name: '', address: '' }],
  });

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch('/api/sellerapplication');
      const data = await response.json();

      if (response.ok) {
        setApplicationStatus(data.application);
        if (data.application === 3) {
          setRejectedReason(data.rejectedReason || 'No reason provided');
        }
      } else {
        setError(data.error || 'Failed to fetch application status');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleStoreChange = (index: number, field: keyof StoreData, value: string) => {
    const updatedStores = [...formData.store];
    updatedStores[index][field] = value;
    setFormData(prev => ({
      ...prev,
      store: updatedStores,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/sellerapplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Application submitted successfully! Please wait 3-4 days for review.');
        setTimeout(() => {
          checkApplicationStatus();
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Application Status: Pending (1)
  if (applicationStatus === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Pending</h1>
          <p className="text-gray-600 mb-6">
            Your seller application is currently under review. Please wait 3-4 days for approval.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              We&apos;ll notify you via email once your application is processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Application Status: Approved (2)
  if (applicationStatus === 2) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Congratulations!</h1>
          <p className="text-gray-600 mb-6">
            Your seller application has been approved. You can now access the seller dashboard.
          </p>
          <a
            href={`${appUrl}/seller`}
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Access Seller Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Application Status: Rejected (3)
  if (applicationStatus === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Rejected</h1>
          <p className="text-gray-600 mb-4">
            Unfortunately, your seller application has been rejected.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-red-900 mb-2">Rejection Reason:</p>
            <p className="text-sm text-red-800">{rejectedReason}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            You can address the issues mentioned above and submit a new application.
          </p>
          <button
            onClick={() => {
              setApplicationStatus(0);
              setRejectedReason('');
            }}
            className="w-full bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Apply Again
          </button>
        </div>
      </div>
    );
  }

  // Application Status: No Application (0) - Show Form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Become a Seller</h1>
            <p className="text-green-50">Fill in the details below to start selling on our platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Business Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-green-600">
                <Building2 className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your business name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gstNumber"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter GST number"
                  />
                </div>

                <div>
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter PAN number"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-green-600">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
              </div>

              <div>
                <label htmlFor="bankDetails.accountMasked" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bankDetails.accountMasked"
                  name="bankDetails.accountMasked"
                  value={formData.bankDetails.accountMasked}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter account number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bankDetails.ifsc" className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankDetails.ifsc"
                    name="bankDetails.ifsc"
                    value={formData.bankDetails.ifsc}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter IFSC code"
                  />
                </div>

                <div>
                  <label htmlFor="bankDetails.bankName" className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankDetails.bankName"
                    name="bankDetails.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter bank name"
                  />
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-green-600">
                <Store className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Store Information</h2>
              </div>

              {formData.store.map((store, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label htmlFor={`store-name-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`store-name-${index}`}
                      value={store.name}
                      onChange={(e) => handleStoreChange(index, 'name', e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      placeholder="Enter store name"
                    />
                  </div>

                  <div>
                    <label htmlFor={`store-address-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Store Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id={`store-address-${index}`}
                      value={store.address}
                      onChange={(e) => handleStoreChange(index, 'address', e.target.value)}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white resize-none"
                      placeholder="Enter complete store address"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              By submitting this form, you agree to our terms and conditions for sellers.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

