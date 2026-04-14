import React from 'react';
import { Settings as SettingsIcon, Shield, Bell, User } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-600" />
            General Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage your system preferences and account configurations.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Login Security</p>
                <p className="text-sm text-gray-500">Enable multi-factor authentication for higher security.</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              Configure
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Manage how you receive alerts for new billing uploads.</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
