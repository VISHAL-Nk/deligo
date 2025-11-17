'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface SellerProfile {
  storefront: {
    logo: string;
    banner: string;
    bio: string;
    contactEmail: string;
    contactPhone: string;
  };
  maintenanceMode: boolean;
  kycStatus: string;
  kycDocuments: {
    type: string;
    url: string;
  }[];
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    bio: '',
    contactEmail: '',
    contactPhone: '',
    maintenanceMode: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/seller/profile');
      const data = await response.json();
      
      if (data.success && data.profile) {
        setProfile(data.profile);
        setFormData({
          bio: data.profile.storefront?.bio || '',
          contactEmail: data.profile.storefront?.contactEmail || '',
          contactPhone: data.profile.storefront?.contactPhone || '',
          maintenanceMode: data.profile.maintenanceMode || false,
        });
        setLogoPreview(data.profile.storefront?.logo || '');
        setBannerPreview(data.profile.storefront?.banner || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();

      if (logoFile) formDataToSend.append('logo', logoFile);
      if (bannerFile) formDataToSend.append('banner', bannerFile);
      
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('contactEmail', formData.contactEmail);
      formDataToSend.append('contactPhone', formData.contactPhone);
      formDataToSend.append('maintenanceMode', formData.maintenanceMode.toString());

      const response = await fetch('/api/seller/profile', {
        method: 'PATCH',
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-1">Manage your store profile and preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p>{message.text}</p>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Storefront */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Storefront</h2>
            </div>

            {/* Logo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo" width={96} height={96} className="object-cover" />
                  ) : (
                    <Store className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors inline-flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'logo')}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">Recommended: 200x200px, PNG or JPG</p>
            </div>

            {/* Banner */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Banner</label>
              <div className="space-y-3">
                <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {bannerPreview ? (
                    <Image src={bannerPreview} alt="Banner" width={800} height={192} className="object-cover w-full h-full" />
                  ) : (
                    <Store className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors inline-flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Banner
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'banner')}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">Recommended: 1200x300px, PNG or JPG</p>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell customers about your store..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="store@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
          </div>

          {/* Store Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Status</h2>
            
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-600">Hide your store from customers temporarily</p>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded"
              />
            </label>
          </div>

          {/* KYC Status */}
          {profile && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">KYC Verification</h2>
              
              <div className={`p-4 rounded-lg border ${
                profile.kycStatus === 'verified' 
                  ? 'bg-green-50 border-green-200' 
                  : profile.kycStatus === 'pending'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {profile.kycStatus === 'verified' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : profile.kycStatus === 'pending' ? (
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-gray-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      Status: {profile.kycStatus.charAt(0).toUpperCase() + profile.kycStatus.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.kycStatus === 'verified' && 'Your account is verified'}
                      {profile.kycStatus === 'pending' && 'Your documents are under review'}
                      {profile.kycStatus === 'not_submitted' && 'Please submit your KYC documents'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
