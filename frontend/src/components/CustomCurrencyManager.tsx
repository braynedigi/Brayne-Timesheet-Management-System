import React, { useState, useEffect } from 'react';
import { useCurrencyStore, CustomCurrency } from '@/store/currencyStore';
import { Plus, Edit, Trash2, Star, StarOff, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomCurrencyManagerProps {
  onCurrencySelect?: (currency: CustomCurrency) => void;
  selectedCurrencyId?: string;
}

const CustomCurrencyManager: React.FC<CustomCurrencyManagerProps> = ({
  onCurrencySelect,
  selectedCurrencyId,
}) => {
  const {
    customCurrencies,
    builtInCurrencies,
    isLoading,
    error,
    fetchCustomCurrencies,
    fetchBuiltInCurrencies,
    createCustomCurrency,
    updateCustomCurrency,
    deleteCustomCurrency,
    setDefaultCurrency,
    setError,
  } = useCurrencyStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CustomCurrency | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: 1.0,
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    fetchCustomCurrencies();
    fetchBuiltInCurrencies();
  }, [fetchCustomCurrencies, fetchBuiltInCurrencies]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCurrency) {
        await updateCustomCurrency(editingCurrency.id, formData);
        toast.success('Currency updated successfully');
      } else {
        await createCustomCurrency(formData);
        toast.success('Currency created successfully');
      }
      
      setShowForm(false);
      setEditingCurrency(null);
      resetForm();
    } catch (error) {
      // Error is already handled by the store
    }
  };

  const handleEdit = (currency: CustomCurrency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate,
      isDefault: currency.isDefault,
      isActive: currency.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (currency: CustomCurrency) => {
    if (window.confirm(`Are you sure you want to delete ${currency.name}?`)) {
      try {
        await deleteCustomCurrency(currency.id);
        toast.success('Currency deleted successfully');
      } catch (error) {
        // Error is already handled by the store
      }
    }
  };

  const handleSetDefault = async (currency: CustomCurrency) => {
    try {
      await setDefaultCurrency(currency.id);
      toast.success(`${currency.name} set as default`);
    } catch (error) {
      // Error is already handled by the store
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: 1.0,
      isDefault: false,
      isActive: true,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCurrency(null);
    resetForm();
  };

  const handleCurrencySelect = (currency: CustomCurrency) => {
    if (onCurrencySelect) {
      onCurrencySelect(currency);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Custom Currencies
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Currency
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="USD"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uppercase letters and numbers only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="US Dollar"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="$"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exchange Rate (vs USD) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  max="999999.999999"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1.0 })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="1.0"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Rate relative to USD (1 USD = this amount)
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Set as default currency
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : editingCurrency ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Currencies List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Your Custom Currencies
          </h4>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Loading currencies...
          </div>
        ) : customCurrencies.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No custom currencies yet. Create your first one!
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {customCurrencies.map((currency) => (
              <div
                key={currency.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  selectedCurrencyId === currency.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => handleCurrencySelect(currency)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {currency.isDefault ? (
                        <Star className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {currency.symbol}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {currency.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {currency.code} • 1 USD = {currency.exchangeRate} {currency.code}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!currency.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(currency);
                        }}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(currency);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(currency);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Built-in Currencies */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Built-in Currencies
          </h4>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {builtInCurrencies.map((currency) => (
            <div
              key={currency.code}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => onCurrencySelect && onCurrencySelect({
                id: currency.code,
                code: currency.code,
                name: currency.name,
                symbol: currency.symbol,
                isDefault: false,
                isActive: true,
                exchangeRate: 1.0,
                createdAt: '',
                updatedAt: '',
              })}
            >
              <div className="flex items-center space-x-3">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {currency.symbol}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {currency.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {currency.code}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomCurrencyManager;
