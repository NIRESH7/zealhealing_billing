import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../services/api';
import { Search, Eye, Download, X, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, MessageCircle, AlertTriangle, Edit3, Trash2, Filter, Layers, Eraser, MoreVertical, Plus, ChevronDown, FileText, Calendar, Package, Check, Upload, Image, ShieldCheck, ShieldX, FileImage, Bookmark, Edit2 } from 'lucide-react';
import WhatsAppConfirmationModal from '../components/WhatsAppConfirmationModal';
import { AuthContext } from '../context/AuthContext';

// --- Export Analytics Modal ---
function ExportModal({ onClose }) {
  const [filterMode, setFilterMode] = useState('date'); // 'date' | 'product' | 'both'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Validation States
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [futureWarning, setFutureWarning] = useState('');

  // Preset State
  const [selectedPreset, setSelectedPreset] = useState('Custom Range');

  // Auth Context & Confirmation Summary state
  const { user } = useContext(AuthContext);
  const [showSummary, setShowSummary] = useState(false);
  const [generatedTime, setGeneratedTime] = useState('');

  // Export History States
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'history'
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('all');
  const [historyCustomStart, setHistoryCustomStart] = useState('');
  const [historyCustomEnd, setHistoryCustomEnd] = useState('');
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [expandedTxId, setExpandedTxId] = useState(null);

  const fetchHistoryLogs = useCallback(async () => {
    setHistoryLoading(true);
    try {
      let url = '/export-audit/logs?';
      const params = new URLSearchParams();
      if (historySearch) params.append('search', historySearch);
      if (historyFilterType && historyFilterType !== 'all') {
        params.append('filter_type', historyFilterType);
        if (historyFilterType === 'custom') {
          if (historyCustomStart) params.append('custom_start', historyCustomStart);
          if (historyCustomEnd) params.append('custom_end', historyCustomEnd);
        }
      }
      const response = await api.get(url + params.toString());
      setHistoryLogs(response.data);
      setHistoryPage(1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historySearch, historyFilterType, historyCustomStart, historyCustomEnd]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryLogs();
    }
  }, [activeTab, fetchHistoryLogs]);

  const handleViewDetails = async (log) => {
    setSelectedHistoryLog(log);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/export-audit/logs/${log.id}/details`);
      setHistoryDetails(response.data);
    } catch (err) {
      console.error('Error fetching log details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Helper to format Date object into YYYY-MM-DD using local timezone
  const formatDateLocal = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Presets definition
  const presets = [
    { name: 'Today', getValue: () => {
      const today = new Date();
      return [formatDateLocal(today), formatDateLocal(today)];
    }},
    { name: 'Yesterday', getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return [formatDateLocal(yesterday), formatDateLocal(yesterday)];
    }},
    { name: 'This Week', getValue: () => {
      const today = new Date();
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + diffToMonday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return [formatDateLocal(startOfWeek), formatDateLocal(endOfWeek)];
    }},
    { name: 'Last Week', getValue: () => {
      const today = new Date();
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + diffToMonday);
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      return [formatDateLocal(startOfLastWeek), formatDateLocal(endOfLastWeek)];
    }},
    { name: 'This Month', getValue: () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return [formatDateLocal(startOfMonth), formatDateLocal(endOfMonth)];
    }},
    { name: 'Last Month', getValue: () => {
      const today = new Date();
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return [formatDateLocal(startOfLastMonth), formatDateLocal(endOfLastMonth)];
    }},
    { name: 'Current Financial Year', getValue: () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed
      let startYear = currentYear;
      if (currentMonth < 3) { // Jan, Feb, Mar
        startYear = currentYear - 1;
      }
      const startOfFY = new Date(startYear, 3, 1); // 1 April
      const endOfFY = new Date(startYear + 1, 2, 31); // 31 March
      return [formatDateLocal(startOfFY), formatDateLocal(endOfFY)];
    }},
    { name: 'Previous Financial Year', getValue: () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      let startYear = currentYear;
      if (currentMonth < 3) {
        startYear = currentYear - 1;
      }
      const startOfPrevFY = new Date(startYear - 1, 3, 1); // 1 April
      const endOfPrevFY = new Date(startYear, 2, 31); // 31 March
      return [formatDateLocal(startOfPrevFY), formatDateLocal(endOfPrevFY)];
    }},
    { name: 'Custom Range', getValue: () => [startDate, endDate] }
  ];

  const handlePresetSelect = (presetName) => {
    setSelectedPreset(presetName);
    const preset = presets.find(p => p.name === presetName);
    if (preset && presetName !== 'Custom Range') {
      const [start, end] = preset.getValue();
      setStartDate(start);
      setEndDate(end);
    }
  };

  useEffect(() => {
    api.get('/products').then(res => {
      setProducts(res.data);
      setLoadingProducts(false);
    }).catch(() => setLoadingProducts(false));
  }, []);

  // Adjust active preset when date inputs change manually
  useEffect(() => {
    if (selectedPreset !== 'Custom Range') {
      const preset = presets.find(p => p.name === selectedPreset);
      if (preset) {
        const [start, end] = preset.getValue();
        if (start !== startDate || end !== endDate) {
          setSelectedPreset('Custom Range');
        }
      }
    }
  }, [startDate, endDate]);

  // Validation hook
  useEffect(() => {
    setStartDateError('');
    setEndDateError('');
    setRangeError('');
    setFutureWarning('');

    if (filterMode === 'date' || filterMode === 'both') {
      let hasError = false;

      // 1. Required checks
      if (startDate === null || startDate === undefined || startDate === '' || String(startDate).trim() === '') {
        setStartDateError('Start Date is required.');
        hasError = true;
      }
      if (endDate === null || endDate === undefined || endDate === '' || String(endDate).trim() === '') {
        setEndDateError('End Date is required.');
        hasError = true;
      }

      // 2. Reject Invalid dates
      let startObj = null;
      let endObj = null;

      if (startDate && startDate !== '' && !startDateError) {
        if (isNaN(Date.parse(startDate))) {
          setStartDateError('Invalid Start Date.');
          hasError = true;
        } else {
          startObj = new Date(startDate);
        }
      }

      if (endDate && endDate !== '' && !endDateError) {
        if (isNaN(Date.parse(endDate))) {
          setEndDateError('Invalid End Date.');
          hasError = true;
        } else {
          endObj = new Date(endDate);
        }
      }

      // 3. End Date cannot be earlier than Start Date
      if (startObj && endObj) {
        if (endObj < startObj) {
          setRangeError('End Date cannot be earlier than Start Date.');
          hasError = true;
        }
      }

      // 4. Future dates warning (non-blocking)
      if (!hasError && (startObj || endObj)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isStartFuture = startObj && startObj > today;
        const isEndFuture = endObj && endObj > today;

        if (isStartFuture || isEndFuture) {
          setFutureWarning('The selected period includes future dates.');
        }
      }
    }
  }, [startDate, endDate, filterMode]);

  // Preview States
  const [previewData, setPreviewData] = useState({
    transaction_count: 0,
    item_count: 0,
    total_sales: 0,
    received_amount: 0,
    balance_amount: 0
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // Suggestions States
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Export Progress States
  const [exportState, setExportState] = useState('idle'); // 'idle' | 'preparing' | 'generating' | 'downloading' | 'completed' | 'failed'
  const [exportMessage, setExportMessage] = useState('');

  const fetchSuggestions = async (payload) => {
    setLoadingSuggestions(true);
    try {
      const res = await api.post('/transactions/export-suggestions', payload);
      if (res.data && res.data.success) {
        setSuggestions(res.data);
      } else {
        setSuggestions(null);
      }
    } catch (err) {
      setSuggestions(null);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getSuggestionsList = () => {
    if (!suggestions) return [];
    const list = [];

    const hasDateFilter = filterMode === 'date' || filterMode === 'both';
    const hasProductFilter = filterMode === 'product' || filterMode === 'both';

    // 1. If Date + Product returns zero
    if (filterMode === 'both' && startDate && endDate && selectedProducts.length > 0) {
      list.push({
        text: '💡 Try exporting by Date only',
        action: () => {
          setFilterMode('date');
        }
      });
    }

    // 2. If Product Filter causes zero results (or product no longer exists)
    if (hasProductFilter && selectedProducts.length > 0) {
      list.push({
        text: '💡 Remove Product Filter',
        action: () => {
          setSelectedProducts([]);
        }
      });
      list.push({
        text: '💡 Select All Products',
        action: () => {
          setSelectedProducts([]);
        }
      });
    }

    // 3. Date suggestions
    if (hasDateFilter) {
      if (suggestions.nearest_transaction_date) {
        const niceNearest = formatDateFromInput(suggestions.nearest_transaction_date);
        list.push({
          text: `💡 Try nearest transaction date (${niceNearest})`,
          action: () => {
            setStartDate(suggestions.nearest_transaction_date);
            setEndDate(suggestions.nearest_transaction_date);
            setSelectedPreset('Custom Range');
          }
        });
      }

      list.push({
        text: '💡 Try "This Month"',
        action: () => {
          handlePresetSelect('This Month');
        }
      });

      if (suggestions.available_financial_years && suggestions.available_financial_years.length > 0) {
        suggestions.available_financial_years.slice(0, 2).forEach(fy => {
          list.push({
            text: `💡 Try "${fy}"`,
            action: () => {
              const match = fy.match(/FY (\d+)-(\d+)/);
              if (match) {
                const startYr = 2000 + parseInt(match[1]);
                const endYr = 2000 + parseInt(match[2]);
                setStartDate(`${startYr}-04-01`);
                setEndDate(`${endYr}-03-31`);
                setSelectedPreset('Custom Range');
              }
            }
          });
        });
      }

      if (suggestions.recommended_date_range) {
        const startFormatted = formatDateFromInput(suggestions.recommended_date_range.start);
        const endFormatted = formatDateFromInput(suggestions.recommended_date_range.end);
        list.push({
          text: `💡 Expand date range to recommended month (${startFormatted} → ${endFormatted})`,
          action: () => {
            setStartDate(suggestions.recommended_date_range.start);
            setEndDate(suggestions.recommended_date_range.end);
            setSelectedPreset('Custom Range');
          }
        });
      }
    }

    return list;
  };

  // Templates States
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/export/templates/');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleApplyTemplate = async (template) => {
    try {
      setFilterMode(template.filter_mode);
      setSelectedProducts(template.selected_products || []);
      
      if (template.date_preset && template.date_preset !== 'Custom Range') {
        handlePresetSelect(template.date_preset);
      } else {
        setStartDate(template.custom_start_date || '');
        setEndDate(template.custom_end_date || '');
        setSelectedPreset('Custom Range');
      }
      
      // Update last used on backend asynchronously
      api.put(`/export/templates/${template.id}`, {
        last_used: new Date().toISOString()
      }).then(() => fetchTemplates()).catch(() => {});
      
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      setTemplateError('Template name is required.');
      return;
    }
    setSavingTemplate(true);
    setTemplateError('');
    try {
      const payload = {
        template_name: newTemplateName.trim(),
        filter_mode: filterMode,
        date_preset: selectedPreset,
        custom_start_date: selectedPreset === 'Custom Range' ? startDate : null,
        custom_end_date: selectedPreset === 'Custom Range' ? endDate : null,
        selected_products: selectedProducts
      };
      const res = await api.post('/export/templates/', payload);
      setTemplates(prev => [...prev, res.data].sort((a, b) => a.template_name.localeCompare(b.template_name)));
      setIsSavingTemplate(false);
      setNewTemplateName('');
    } catch (err) {
      setTemplateError(err?.response?.data?.detail || 'Failed to save template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleRenameTemplate = async (id) => {
    if (!editingTemplateName.trim()) return;
    try {
      const res = await api.put(`/export/templates/${id}`, {
        template_name: editingTemplateName.trim()
      });
      setTemplates(prev => prev.map(t => t.id === id ? res.data : t).sort((a, b) => a.template_name.localeCompare(b.template_name)));
      setEditingTemplateId(null);
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to rename template.');
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await api.delete(`/export/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setDeletingTemplateId(null);
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete template.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  useEffect(() => {
    let isFormValid = true;
    if (filterMode === 'date' || filterMode === 'both') {
      if (
        !startDate ||
        !endDate ||
        startDateError ||
        endDateError ||
        rangeError ||
        isNaN(Date.parse(startDate)) ||
        isNaN(Date.parse(endDate)) ||
        (new Date(endDate) < new Date(startDate))
      ) {
        isFormValid = false;
      }
    }

    if (!isFormValid) {
      setPreviewData({
        transaction_count: 0,
        item_count: 0,
        total_sales: 0,
        received_amount: 0,
        balance_amount: 0
      });
      setPreviewError('');
      setPreviewLoading(false);
      setSuggestions(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');

    const handler = setTimeout(async () => {
      try {
        const payload = {};
        if (filterMode === 'date' || filterMode === 'both') {
          payload.start_date = startDate;
          payload.end_date = endDate;
        }
        if (filterMode === 'product' || filterMode === 'both') {
          if (selectedProducts.length > 0) {
            payload.products = selectedProducts;
          }
        }

        const res = await api.post('/transactions/export-preview', payload);
        if (res.data && res.data.success) {
          setPreviewData({
            transaction_count: res.data.transaction_count,
            item_count: res.data.item_count,
            total_sales: res.data.total_sales,
            received_amount: res.data.received_amount,
            balance_amount: res.data.balance_amount
          });
          if (res.data.transaction_count === 0) {
            fetchSuggestions(payload);
          } else {
            setSuggestions(null);
          }
        } else {
          setPreviewError('Failed to fetch preview.');
          setSuggestions(null);
        }
      } catch (err) {
        setPreviewError(err?.response?.data?.message || 'Failed to load live preview.');
        setSuggestions(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [startDate, endDate, selectedProducts, filterMode, startDateError, endDateError, rangeError]);

  const isExportDisabled = loading || previewLoading || previewData.transaction_count === 0 || (
    (filterMode === 'date' || filterMode === 'both') && (
      !startDate ||
      !endDate ||
      startDateError ||
      endDateError ||
      rangeError ||
      isNaN(Date.parse(startDate)) ||
      isNaN(Date.parse(endDate)) ||
      (new Date(endDate) < new Date(startDate))
    )
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (name) => {
    setSelectedProducts(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const renderExportProgress = () => {
    const isCompleted = exportState === 'completed';
    const isFailed = exportState === 'failed';
    const isPreparing = exportState === 'preparing';
    const isGenerating = exportState === 'generating';
    const isDownloading = exportState === 'downloading';

    return (
      <div className="px-8 py-12 flex flex-col items-center justify-center space-y-6 bg-slate-50/50 min-h-[300px]">
        {/* Animated Icon State */}
        {isFailed ? (
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
        ) : isCompleted ? (
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 animate-pulse">
            <Check className="w-8 h-8" />
          </div>
        ) : (
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <Download className="w-6 h-6 text-emerald-500 animate-bounce" />
          </div>
        )}

        {/* Text Details */}
        <div className="text-center space-y-2 max-w-sm">
          <h4 className="text-sm font-black text-slate-800 tracking-tight">
            {isFailed && 'Export Failed'}
            {isCompleted && 'Export Completed Successfully!'}
            {isPreparing && 'Preparing Export...'}
            {isGenerating && 'Generating Report...'}
            {isDownloading && 'Preparing Download...'}
          </h4>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            {exportMessage}
          </p>
        </div>

        {/* Custom Premium Status indicator */}
        {!isFailed && !isCompleted && (
          <div className="w-full max-w-[200px] h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-full transition-all duration-500" style={{
              width: isPreparing ? '25%' : isGenerating ? '75%' : '90%'
            }}></div>
          </div>
        )}

        {/* Retry / Dismiss Buttons for Failure */}
        {isFailed && (
          <div className="flex gap-3 w-full max-w-[240px] pt-2">
            <button
              onClick={() => {
                setExportState('idle');
                setShowSummary(false);
              }}
              className="flex-1 px-4 py-2 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors text-center border border-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all text-center"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleExport = async () => {
    // Additional defense
    if (previewData.transaction_count === 0) {
      alert("No transactions were found for the selected filters.");
      return;
    }

    if (filterMode === 'date' || filterMode === 'both') {
      if (!startDate || !endDate || isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate)) || new Date(endDate) < new Date(startDate)) {
        return;
      }
    }

    if (!showSummary) {
      setGeneratedTime(new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }));
      setShowSummary(true);
      return;
    }

    // Enter export states
    setExportState('preparing');
    setExportMessage('Validating Filters...');
    await new Promise(resolve => setTimeout(resolve, 800));

    setExportState('generating');
    setExportMessage('Collecting Transactions & Generating Excel Workbook...');

    setLoading(true);
    try {
      const payload = {
        filter_mode: filterMode
      };
      if (filterMode === 'date' || filterMode === 'both') {
        if (startDate) payload.start_date = startDate;
        if (endDate) payload.end_date = endDate;
      }
      if (filterMode === 'product' || filterMode === 'both') {
        if (selectedProducts.length > 0) payload.products = selectedProducts;
      }

      const response = await api.post('/transactions/export-analytics', payload, {
        responseType: 'blob'
      });

      setExportState('downloading');
      setExportMessage('Preparing Download...');
      await new Promise(resolve => setTimeout(resolve, 600));

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      
      let filename = 'Sale_Report';
      if ((filterMode === 'date' || filterMode === 'both') && startDate && endDate) {
        const formatD = (dStr) => {
          const parts = dStr.split('-');
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        };
        filename = `Sale_Report_${formatD(startDate)}_to_${formatD(endDate)}`;
      } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        filename = `Sale_Report_${dd}-${mm}-${yyyy}`;
      }
      filename += '.xlsx';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with a slight delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);

      setExportState('completed');
      setExportMessage('Report downloaded successfully.');

      // Wait 2.5 seconds to let the user see "completed" state, then close and reset
      setTimeout(() => {
        setExportState('idle');
        setShowSummary(false);
        onClose();
      }, 2500);
    } catch (err) {
      setExportState('failed');
      if (err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            setExportMessage(data.message || 'Unable to generate the report. Please try again.');
          } catch {
            setExportMessage('Unable to generate the report. Please try again.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setExportMessage(err?.response?.data?.message || 'Unable to generate the report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNiceDate = (dateStr) => {
    if (!dateStr) return 'None';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month, day] = dateStr.split('-');
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const filterTabs = [
    { key: 'date', label: 'By Date', icon: Calendar },
    { key: 'product', label: 'By Product', icon: Package },
    { key: 'both', label: 'Both Filters', icon: Filter },
  ];

  const renderHistoryLogsList = () => {
    const itemsPerPage = 6;
    const totalPages = Math.ceil(historyLogs.length / itemsPerPage);
    const paginatedLogs = historyLogs.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

    return (
      <div className="px-8 py-6 space-y-4 max-h-[580px] overflow-y-auto bg-slate-50/50">
        {/* Controls: Search & Filters */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user, filename, or mode..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            
            {/* Filter Type */}
            <div className="relative min-w-[150px]">
              <select
                value={historyFilterType}
                onChange={(e) => {
                  setHistoryFilterType(e.target.value);
                  if (e.target.value !== 'custom') {
                    setHistoryCustomStart('');
                    setHistoryCustomEnd('');
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 bg-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="fy">Financial Year</option>
                <option value="custom">Custom Date</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Custom Date Inputs if Custom is selected */}
          {historyFilterType === 'custom' && (
            <div className="flex items-center gap-3 border-t border-slate-100 pt-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Start Date</span>
                <input
                  type="date"
                  value={historyCustomStart}
                  onChange={(e) => setHistoryCustomStart(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">End Date</span>
                <input
                  type="date"
                  value={historyCustomEnd}
                  onChange={(e) => setHistoryCustomEnd(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table / List */}
        {historyLoading ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200/80">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : historyLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 p-6 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-[12px] font-black text-slate-800 uppercase tracking-wider">No Export Logs Found</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium">No successful exports match your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-[20px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">User / Date</th>
                      <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Filter Mode</th>
                      <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Parameters</th>
                      <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Metrics</th>
                      <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Filename</th>
                      <th className="px-5 py-3.5 text-right text-[9px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-bold text-slate-700">
                    {paginatedLogs.map((log) => {
                      const dt = new Date(log.exported_at);
                      const formattedDate = dt.toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <span className="block font-black text-slate-900">{log.exported_by}</span>
                            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">{formattedDate}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              log.filter_mode === 'date'
                                ? 'bg-indigo-50 text-indigo-600'
                                : log.filter_mode === 'product'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {log.filter_mode === 'date' ? 'Date' : log.filter_mode === 'product' ? 'Product' : 'Both'}
                            </span>
                          </td>
                          <td className="px-4 py-4 max-w-[150px] truncate">
                            {log.filter_mode !== 'product' && log.date_range?.start ? (
                              <span className="block text-slate-600 font-medium">
                                {formatNiceDate(log.date_range.start)} → {formatNiceDate(log.date_range.end)}
                              </span>
                            ) : (
                              <span className="block text-slate-400 font-medium">All Dates</span>
                            )}
                            {log.filter_mode !== 'date' && log.selected_products?.length > 0 && (
                              <span className="block text-[9px] text-slate-400 truncate mt-0.5" title={log.selected_products.join(', ')}>
                                Products: {log.selected_products.join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="block text-emerald-600 font-black">{formatCurrency(log.total_sales)}</span>
                            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">
                              {log.transaction_count} Tx • {log.item_count} Items
                            </span>
                          </td>
                          <td className="px-4 py-4 max-w-[140px] truncate font-medium text-slate-500" title={log.filename}>
                            {log.filename}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-[20px] px-5 py-3 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Page {historyPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(p => p - 1)}
                    className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 disabled:opacity-50 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={historyPage === totalPages}
                    onClick={() => setHistoryPage(p => p + 1)}
                    className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 disabled:opacity-50 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHistoryLogDetails = () => {
    if (!selectedHistoryLog) return null;
    
    return (
      <div className="px-8 py-6 space-y-4 max-h-[580px] overflow-y-auto bg-slate-50/50">
        {/* Back Button */}
        <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-[20px] p-4 shadow-sm">
          <button
            onClick={() => {
              setSelectedHistoryLog(null);
              setHistoryDetails(null);
            }}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Logs
          </button>
          
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Audit Record: #{selectedHistoryLog.id.slice(-6)}
          </span>
        </div>

        {detailsLoading ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200/80">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : !historyDetails ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-[11px] font-bold">
            Failed to load transaction details.
          </div>
        ) : (
          <>
            {/* Metadata Summary Card */}
            <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Export Run Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Exported By</span>
                  <span className="font-black text-slate-800">{selectedHistoryLog.exported_by}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Date Mode</span>
                  <span className="font-black text-slate-800">
                    {selectedHistoryLog.filter_mode === 'date' ? 'Date' : selectedHistoryLog.filter_mode === 'product' ? 'Product' : 'Both'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Date Range</span>
                  <span className="font-black text-slate-800">
                    {selectedHistoryLog.filter_mode === 'product' ? 'All Dates' : `${formatNiceDate(selectedHistoryLog.date_range?.start)} → ${formatNiceDate(selectedHistoryLog.date_range?.end)}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-[11px]">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Transactions</span>
                  <span className="font-black text-slate-800 text-sm">{selectedHistoryLog.transaction_count}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Line Items</span>
                  <span className="font-black text-slate-800 text-sm">{selectedHistoryLog.item_count}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Total Sales</span>
                  <span className="font-black text-emerald-600 text-sm">{formatCurrency(selectedHistoryLog.total_sales)}</span>
                </div>
              </div>
            </div>

            {/* List of matching Transactions */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                Transaction Breakdown
              </h4>
              
              {historyDetails.transactions?.length === 0 ? (
                <div className="p-6 text-center bg-white border border-slate-200/80 rounded-[20px] text-slate-400 text-[11px] font-bold">
                  No transaction breakdown data available.
                </div>
              ) : (
                historyDetails.transactions.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  
                  return (
                    <div key={tx.id} className="bg-white border border-slate-200/80 rounded-[20px] overflow-hidden shadow-sm">
                      <div
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-black text-slate-900">
                              Invoice: {tx.invoice_number}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              ({tx.date})
                            </span>
                          </div>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            Customer: {tx.name} {tx.phone ? `• ${tx.phone}` : ''}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="block text-[12px] font-black text-slate-800">
                              {formatCurrency(tx.total_amount)}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Paid: {formatCurrency(tx.paid_amount)} {tx.balance > 0 ? `• Bal: ${formatCurrency(tx.balance)}` : ''}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/30 px-4 py-3 animate-in fade-in duration-200">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-[10px] font-bold text-slate-600">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400">
                                  <th className="pb-2 font-black uppercase tracking-wider">Item Name</th>
                                  <th className="pb-2 text-center font-black uppercase tracking-wider">Qty</th>
                                  <th className="pb-2 text-right font-black uppercase tracking-wider">Price</th>
                                  <th className="pb-2 text-right font-black uppercase tracking-wider">Discount</th>
                                  <th className="pb-2 text-right font-black uppercase tracking-wider">GST</th>
                                  <th className="pb-2 text-right font-black uppercase tracking-wider">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {(!tx.invoice_items || tx.invoice_items.length === 0) ? (
                                  <tr>
                                    <td colSpan="6" className="py-2.5 text-center text-slate-400 font-medium">
                                      No itemized data available for this transaction.
                                    </td>
                                  </tr>
                                ) : (
                                  tx.invoice_items.map((item, idx) => {
                                    const qty = parseFloat(item.qty || 1);
                                    const price = parseFloat(item.price || 0);
                                    const discVal = parseFloat(item.discount_amount || 0);
                                    const discPct = parseFloat(item.discount_rate || 0);
                                    const gstAmt = parseFloat(item.gst_amount || 0);
                                    const gstRate = parseFloat(item.gst_rate || 0);
                                    const total = parseFloat(item.total || 0);
                                    
                                    return (
                                      <tr key={idx} className="text-slate-800">
                                        <td className="py-2.5 max-w-[200px] truncate">{item.name}</td>
                                        <td className="py-2.5 text-center">{qty}</td>
                                        <td className="py-2.5 text-right">{formatCurrency(price)}</td>
                                        <td className="py-2.5 text-right text-rose-500">
                                          {discVal > 0 ? `${formatCurrency(discVal)} (${discPct}%)` : '0.00'}
                                        </td>
                                        <td className="py-2.5 text-right text-indigo-500">
                                          {gstAmt > 0 ? `${formatCurrency(gstAmt)} (${gstRate}%)` : '0.00'}
                                        </td>
                                        <td className="py-2.5 text-right font-black text-slate-900">
                                          {formatCurrency(total)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className={`bg-white w-full transition-all duration-300 rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${
        activeTab === 'history' ? 'max-w-4xl' : 'max-w-lg'
      }`}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-500" />
              {exportState !== 'idle'
                ? 'Preparing Export...'
                : activeTab === 'history'
                ? 'Export Audit History'
                : showSummary
                ? 'Confirm Export'
                : 'Export Analytics'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
              {exportState !== 'idle'
                ? 'Please wait while we generate your report.'
                : activeTab === 'history'
                ? 'Audit trail of data exports'
                : showSummary
                ? 'Verify report parameters before downloading'
                : 'Download filtered report as Excel'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && exportState === 'idle' && !showSummary && (
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'setup' ? 'history' : 'setup');
                  setSelectedHistoryLog(null);
                  setHistoryDetails(null);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
              >
                {activeTab === 'setup' ? 'View History' : 'Export Builder'}
              </button>
            )}
            {exportState === 'idle' && (
              <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
            )}
          </div>
        </div>

        {exportState !== 'idle' ? (
          renderExportProgress()
        ) : activeTab === 'history' ? (
          selectedHistoryLog ? renderHistoryLogDetails() : renderHistoryLogsList()
        ) : showSummary ? (
          <>
            {/* Export Summary Screen */}
            <div className="px-8 py-6 space-y-4 max-h-[460px] overflow-y-auto bg-slate-50/50">
              <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Export Parameters
                </h4>
                
                <div className="grid grid-cols-2 gap-y-3.5 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Filter Mode</span>
                    <span className="font-black text-slate-800">
                      {filterMode === 'date' ? 'Date' : filterMode === 'product' ? 'Product' : 'Date + Product'}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Selected Date Range</span>
                    <span className="font-black text-slate-800">
                      {filterMode === 'product' ? 'All Dates' : `${formatNiceDate(startDate)} → ${formatNiceDate(endDate)}`}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Selected Products</span>
                    <span className="font-black text-slate-800 leading-relaxed block max-h-[80px] overflow-y-auto">
                      {filterMode === 'date' || selectedProducts.length === 0 ? 'All Products' : selectedProducts.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Data Totals
                </h4>

                <div className="grid grid-cols-2 gap-y-3.5 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Matching Transactions</span>
                    <span className="font-black text-slate-800">{previewData.transaction_count}</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Matching Line Items</span>
                    <span className="font-black text-slate-800">{previewData.item_count}</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Total Sales</span>
                    <span className="font-black text-emerald-600">{formatCurrency(previewData.total_sales)}</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Received Amount</span>
                    <span className="font-black text-slate-800">{formatCurrency(previewData.received_amount)}</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Outstanding Balance</span>
                    <span className="font-black text-rose-500">{formatCurrency(previewData.balance_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Metadata
                </h4>

                <div className="grid grid-cols-2 gap-y-3.5 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Generated By</span>
                    <span className="font-black text-slate-800">{user?.username || 'zeal_admin'}</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Generated On</span>
                    <span className="font-black text-slate-800">{generatedTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end bg-slate-50/30 gap-3">
              <button 
                onClick={() => setShowSummary(false)} 
                disabled={loading}
                className="px-5 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-8 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {loading ? 'Generating...' : 'Confirm Export'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Filter Mode Tabs */}
            <div className="px-8 pt-6">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                {filterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterMode(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      filterMode === tab.key
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Content */}
            <div className="px-8 py-6 space-y-5 max-h-[460px] overflow-y-auto">
              {/* Saved Templates Section */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] p-4.5 space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                    Saved Templates
                  </h4>
                  {!isSavingTemplate ? (
                    <button
                      onClick={() => {
                        setNewTemplateName('');
                        setIsSavingTemplate(true);
                      }}
                      className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Save Current
                    </button>
                  ) : null}
                </div>

                {/* Inline Save Form */}
                {isSavingTemplate && (
                  <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Template Name</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={e => {
                        setNewTemplateName(e.target.value);
                        setTemplateError('');
                      }}
                      placeholder="e.g. Monthly Crystal Sales"
                      className="w-full px-3 py-2 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-400 outline-none transition-all"
                    />
                    {templateError && (
                      <span className="text-[9px] font-bold text-rose-500 block">{templateError}</span>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setIsSavingTemplate(false);
                          setTemplateError('');
                        }}
                        className="px-2.5 py-1.5 text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="px-4 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1"
                      >
                        {savingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Templates List */}
                {loadingTemplates ? (
                  <div className="flex items-center gap-1.5 justify-center py-3 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span className="text-[10px] font-bold">Loading templates...</span>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-3 text-[10px] font-bold text-slate-400">
                    No saved templates. Modify filters and save them as a template.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {templates.map(t => {
                      const isEditing = editingTemplateId === t.id;
                      const isDeleting = deletingTemplateId === t.id;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-emerald-200 rounded-xl transition-all shadow-sm"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1 mr-2">
                              <input
                                type="text"
                                value={editingTemplateName}
                                onChange={e => setEditingTemplateName(e.target.value)}
                                className="px-2 py-1 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-400 outline-none flex-1"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameTemplate(t.id);
                                  if (e.key === 'Escape') setEditingTemplateId(null);
                                }}
                              />
                              <button
                                onClick={() => handleRenameTemplate(t.id)}
                                className="p-1 hover:bg-emerald-50 rounded-md text-emerald-600 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingTemplateId(null)}
                                className="p-1 hover:bg-slate-50 rounded-md text-slate-400 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isDeleting ? (
                            <div className="flex items-center justify-between flex-1">
                              <span className="text-[10px] font-bold text-rose-500 animate-pulse">Delete Template?</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setDeletingTemplateId(null)}
                                  className="px-2 py-1 text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(t.id)}
                                  className="px-2.5 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApplyTemplate(t)}
                                className="flex-1 text-left flex flex-col justify-start group"
                              >
                                <span className="text-[11px] font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                                  {t.template_name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                  {t.filter_mode === 'date' ? '📅 Date' : t.filter_mode === 'product' ? '📦 Product' : '⚡ Combined'}
                                  {t.date_preset && ` • ${t.date_preset.replace('_', ' ')}`}
                                </span>
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingTemplateId(t.id);
                                    setEditingTemplateName(t.template_name);
                                  }}
                                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                                  title="Rename Template"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingTemplateId(t.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                                  title="Delete Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date Range Filter */}
              {(filterMode === 'date' || filterMode === 'both') && (
                <div className="space-y-4">
                  {/* Presets Section */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Quick Date Selection</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {presets.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handlePresetSelect(p.name)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border ${
                            selectedPreset === p.name
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Date Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className={`w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all ${
                          startDateError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-emerald-400'
                        }`}
                      />
                      {startDateError && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 block">{startDateError}</span>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className={`w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all ${
                          endDateError || rangeError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-emerald-400'
                        }`}
                      />
                      {endDateError && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 block">{endDateError}</span>
                      )}
                      {rangeError && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 block">{rangeError}</span>
                      )}
                    </div>
                  </div>
                  
                  {futureWarning && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold">{futureWarning}</span>
                    </div>
                  )}

                  {startDate && endDate && !rangeError && !startDateError && !endDateError && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-700">{startDate} → {endDate}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Product Filter */}
              {(filterMode === 'product' || filterMode === 'both') && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Filter by Products</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-400 outline-none transition-all"
                    />
                  </div>
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProducts.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-100">
                          {name}
                          <button onClick={() => toggleProduct(name)} className="hover:text-rose-500 transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                      <button onClick={() => { setSelectedProducts([]); setStartDate(''); setEndDate(''); }} className="text-[9px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest px-2 transition-colors">Reset All</button>
                    </div>
                  )}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-[180px] overflow-y-auto">
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /></div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-6 text-[11px] font-bold text-slate-400">No products found</div>
                    ) : (
                      filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => toggleProduct(p.name)}
                          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all border-b border-slate-100 last:border-b-0 ${
                            selectedProducts.includes(p.name)
                              ? 'bg-emerald-50/80'
                              : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              selectedProducts.includes(p.name)
                                ? 'bg-emerald-600 border-emerald-600'
                                : 'border-slate-300'
                            }`}>
                              {selectedProducts.includes(p.name) && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{p.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{p.category || ''}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Export Preview */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Export Preview</h4>
                
                {previewLoading ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span className="text-[11px] font-bold">Loading preview...</span>
                  </div>
                ) : previewError ? (
                  <div className="text-[11px] font-bold text-rose-500 py-3 text-center">{previewError}</div>
                ) : (filterMode === 'date' || filterMode === 'both') && (!startDate || !endDate || startDateError || endDateError || rangeError) ? (
                  <div className="text-[11px] font-bold text-slate-400 py-3 text-center">Please enter a valid date range to see preview.</div>
                ) : previewData.transaction_count === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                    <div className="text-center text-[11px] font-bold text-slate-500">
                      No matching transactions found.
                    </div>
                    
                    <div className="text-[10px] space-y-2 text-slate-600 bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">Applied Filters:</div>
                      
                      {(filterMode === 'date' || filterMode === 'both') && (
                        <div className="flex gap-2">
                          <span className="font-bold text-slate-400">Date Range:</span>
                          <span className="font-black text-slate-700">
                            {startDate && endDate ? `${formatDateFromInput(startDate)} → ${formatDateFromInput(endDate)}` : 'None'}
                          </span>
                        </div>
                      )}

                      {(filterMode === 'product' || filterMode === 'both') && (
                        <div className="flex gap-2">
                          <span className="font-bold text-slate-400">Products:</span>
                          <span className="font-black text-slate-700">
                            {selectedProducts.length > 0 ? selectedProducts.join(', ') : 'All Products'}
                          </span>
                        </div>
                      )}
                    </div>

                    {loadingSuggestions ? (
                      <div className="flex flex-col items-center gap-2 justify-center py-4 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        <span className="text-[10px] font-bold">Analyzing suggestions...</span>
                      </div>
                    ) : getSuggestionsList().length > 0 ? (
                      <div className="text-[10px] text-slate-600 bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3.5 space-y-2">
                        <div className="font-bold text-emerald-800 uppercase tracking-wider text-[9px] mb-1">Smart Suggestions:</div>
                        <div className="flex flex-col gap-1.5">
                          {getSuggestionsList().map((sug, idx) => (
                            <button
                              key={idx}
                              onClick={sug.action}
                              className="text-left font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-emerald-100 bg-transparent flex items-center"
                            >
                              {sug.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 bg-amber-50/50 border border-amber-100/50 rounded-xl p-3.5 space-y-1.5">
                        <div className="font-bold text-amber-800 uppercase tracking-wider text-[9px]">Please try one of the following:</div>
                        <ul className="list-disc pl-4 space-y-1 font-bold">
                          <li>Select a wider date range</li>
                          <li>Remove product filters</li>
                          <li>Verify the selected dates</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-500">Matching Transactions</span>
                      <span className="font-black text-slate-900">{previewData.transaction_count}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-slate-200/50">
                      <span className="font-bold text-slate-500">Matching Line Items</span>
                      <span className="font-black text-slate-900">{previewData.item_count}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-slate-200/50">
                      <span className="font-bold text-slate-500">Total Sales</span>
                      <span className="font-black text-emerald-600">{formatCurrency(previewData.total_sales)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-slate-200/50">
                      <span className="font-bold text-slate-500">Received Amount</span>
                      <span className="font-black text-slate-900">{formatCurrency(previewData.received_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-slate-200/50">
                      <span className="font-bold text-slate-500">Outstanding Balance</span>
                      <span className="font-black text-rose-500">{formatCurrency(previewData.balance_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-slate-200/50">
                      <span className="font-bold text-slate-500">Status</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                        Ready to Export
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="text-[10px] font-bold text-slate-400">
                {filterMode === 'date' && (startDate || endDate) && '📅 Date filter active'}
                {filterMode === 'product' && selectedProducts.length > 0 && `📦 ${selectedProducts.length} products selected`}
                {filterMode === 'both' && (
                  <span>
                    {(startDate || endDate) ? '📅 ' : ''}{selectedProducts.length > 0 ? `📦 ${selectedProducts.length} products` : ''}
                  </span>
                )}
                {filterMode === 'date' && !startDate && !endDate && '⚡ All records will be exported'}
                {filterMode === 'product' && selectedProducts.length === 0 && '⚡ All records will be exported'}
                {filterMode === 'both' && !startDate && !endDate && selectedProducts.length === 0 && '⚡ All records will be exported'}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Cancel</button>
                <button
                  onClick={handleExport}
                  disabled={isExportDisabled}
                  className="px-8 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {loading ? 'Generating...' : previewData.transaction_count === 0 ? 'No Data Available' : 'Download Excel'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let [day, month, year] = parts;
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

const formatDateFromInput = (inputVal) => {
  if (!inputVal) return '';
  const [year, month, day] = inputVal.split('-');
  return `${day}/${month}/${year}`;
};

const getBillNumber = (tx) => {
  if (!tx) return '--';
  if (!tx.invoice_number) return '--';
  
  let dateObj = null;
  const dateStr = tx.date;
  if (dateStr) {
    const formats = [
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/,
      /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/
    ];
    for (const regex of formats) {
      const match = dateStr.match(regex);
      if (match) {
        let day, month, year;
        if (regex === formats[2]) {
          year = Number(match[1]);
          month = Number(match[2]);
          day = Number(match[3]);
        } else {
          day = Number(match[1]);
          month = Number(match[2]);
          year = Number(match[3]);
          if (year < 100) {
            year += 2000;
          }
        }
        dateObj = new Date(year, month - 1, day);
        break;
      }
    }
  }
  
  if (!dateObj && tx.timestamp) {
    dateObj = new Date(tx.timestamp);
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  let fy = '';
  if (month >= 4) {
    fy = `${year % 100}-${(year + 1) % 100}`;
  } else {
    fy = `${(year - 1) % 100}-${year % 100}`;
  }
  
  return `ZH/FY${fy}/${tx.invoice_number}`;
};

const getFinancialYear = (tx) => {
  if (!tx) return '--';
  
  let dateObj = null;
  const dateStr = tx.date;
  if (dateStr) {
    const formats = [
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/,
      /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/
    ];
    for (const regex of formats) {
      const match = dateStr.match(regex);
      if (match) {
        let day, month, year;
        if (regex === formats[2]) {
          year = Number(match[1]);
          month = Number(match[2]);
          day = Number(match[3]);
        } else {
          day = Number(match[1]);
          month = Number(match[2]);
          year = Number(match[3]);
          if (year < 100) {
            year += 2000;
          }
        }
        dateObj = new Date(year, month - 1, day);
        break;
      }
    }
  }
  
  if (!dateObj && tx.timestamp) {
    dateObj = new Date(tx.timestamp);
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  let fy = '';
  if (month >= 4) {
    fy = `${year % 100}-${(year + 1) % 100}`;
  } else {
    fy = `${(year - 1) % 100}-${year % 100}`;
  }
  
  return `FY ${fy}`;
};

// --- Simplified Edit Modal (SaaS Style) ---
// --- SaaS Multi-Product Search & Bill Creator ---
function CreateModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', transaction_id: '', amount: 0, product: '', 
    region: 'India', date: new Date().toLocaleDateString('en-GB'),
    gst_rate: 0, cgst: 0, sgst: 0, total_amount: 0, paid_amount: 0, hsn_code: ''
  });
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length > 1) {
      api.get('/products', { params: { search } }).then(res => setProducts(res.data));
    }
  }, [search]);

  const selectProduct = (p) => {
    const price = formData.region === 'India' ? p.price_india : p.price_abroad;
    const gstRate = formData.region === 'India' ? p.gst_rate : 0;
    const gstAmt = price * (gstRate / 100);
    
    setFormData({
      ...formData,
      product: p.name,
      amount: price,
      gst_rate: gstRate,
      cgst: gstAmt / 2,
      sgst: gstAmt / 2,
      total_amount: price + gstAmt,
      paid_amount: price + gstAmt,
      hsn_code: p.hsn_code || ''
    });
    setSearch(p.name);
    setShowSuggestions(false);
  };

  const calculate = (region) => {
    // If we have a product selected, re-calc based on region
    const p = products.find(prod => prod.name === formData.product);
    if (p) {
      const price = region === 'India' ? p.price_india : p.price_abroad;
      const gstRate = region === 'India' ? p.gst_rate : 0;
      const gstAmt = price * (gstRate / 100);
      setFormData(prev => ({
        ...prev,
        region,
        amount: price,
        gst_rate: gstRate,
        cgst: gstAmt / 2,
        sgst: gstAmt / 2,
        total_amount: price + gstAmt,
        paid_amount: price + gstAmt
      }));
    } else {
      setFormData(prev => ({ ...prev, region }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/transactions/manual', formData);
      onSave();
    } catch { alert('Creation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Generate Smart Bill</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Manual Ledger Entry Process</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
               <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg w-fit">
                  {['India', 'Abroad'].map(r => (
                    <button 
                      key={r} type="button"
                      onClick={() => calculate(r)}
                      className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                        formData.region === r 
                          ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
               </div>
            </div>

            <div className="col-span-2 relative">
              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Search Product / Service</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input 
                  type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Type product name (Tarot, Crystal...)"
                />
              </div>
              {showSuggestions && products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-[110] max-h-60 overflow-y-auto">
                   {products.map(p => (
                     <div key={p.id} onClick={() => selectProduct(p)} className="p-2.5 hover:bg-emerald-50 rounded-md cursor-pointer flex justify-between items-center group transition-all">
                        <span className="text-[12px] font-black text-slate-700 group-hover:text-emerald-600">{p.name}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight">{p.category}</span>
                           <span className="text-[11px] font-black text-emerald-600">₹{formData.region === 'India' ? p.price_india : p.price_abroad}</span>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Customer Name</label>
               <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" placeholder="Enter name" />
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Billing Date</label>
               <input required type="date" value={formatDateForInput(formData.date)} onChange={e => setFormData({...formData, date: formatDateFromInput(e.target.value)})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" />
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">GPay/Ref ID</label>
               <input required type="text" value={formData.transaction_id} onChange={e => setFormData({...formData, transaction_id:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 placeholder:uppercase" placeholder="TXN123456" />
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Contact Identity</label>
               <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" placeholder="WhatsApp Number" />
            </div>

            <div className="col-span-2">
               <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Paid Amount (₹)</label>
               <input required type="number" value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: Number(e.target.value)})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" placeholder="Amount Paid" />
            </div>

            <div className="col-span-2 bg-emerald-50/40 p-5 border border-emerald-100/50 rounded-lg text-emerald-700 flex items-center justify-between">
               <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Calculated Total</span>
                  <span className="text-2xl font-black tracking-tighter text-emerald-700">₹{formData.total_amount.toLocaleString('en-IN')}</span>
               </div>
               <div className="text-right">
                  <span className="inline-block text-[9px] font-black text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded uppercase tracking-wider mb-1.5">GST {formData.gst_rate}%</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Base: ₹{formData.amount.toLocaleString('en-IN')} | Tax: ₹{(formData.cgst + formData.sgst).toLocaleString('en-IN')}</p>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-[11px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors">Abort</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-900 shadow-lg shadow-emerald-100/50 transition-all disabled:opacity-50">
              {loading ? 'Processing...' : 'Verify & Generate Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Edit Modal (Simple SaaS Style) ---
function EditModal({ tx, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...tx });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/transactions/${tx.id}`, formData);
      onSave();
    } catch { alert('Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Edit Transaction</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Direct Record Modification</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Customer Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Transaction ID</label>
              <input type="text" value={formData.transaction_id} onChange={e => setFormData({...formData, transaction_id: e.target.value})} className="w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Billing Date</label>
              <input type="date" value={formatDateForInput(formData.date)} onChange={e => setFormData({...formData, date: formatDateFromInput(e.target.value)})} className="w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Total Amount (₹)</label>
              <input type="number" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: Number(e.target.value)})} className="w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Paid Amount (₹)</label>
              <input type="number" value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: Number(e.target.value)})} className="w-full px-4 py-3 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Payment Proof Cell Component ---
function PaymentProofCell({ tx, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const hasProof = !!tx.payment_proof_url;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Please upload an image (JPG, PNG, GIF, WebP) or PDF file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/transactions/${tx.id}/payment-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onRefresh();
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove payment proof?')) return;
    try {
      await api.delete(`/transactions/${tx.id}/payment-proof`);
      onRefresh();
    } catch {
      alert('Failed to remove proof.');
    }
  };

  const proofUrl = tx.payment_proof_url ? `${BASE_URL}${tx.payment_proof_url}` : null;
  const isPdf = tx.payment_proof_url?.toLowerCase().endsWith('.pdf');

  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        {hasProof ? (
          <>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Verified</span>
            </div>
            <button
              onClick={() => setShowPreview(true)}
              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" 
              title="View Proof"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title="Remove Proof"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
              <ShieldX className="w-3 h-3 text-slate-300" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pending</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
              title="Upload Payment Proof"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Preview Modal */}
      {showPreview && proofUrl && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPreview(false)}>
          <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                  <FileImage className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Payment Proof</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">{tx.name} — {tx.payment_proof_filename || 'Uploaded File'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={proofUrl}
                  download
                  className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-500 transition-all"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={handleDelete}
                  className="p-2.5 hover:bg-rose-50 rounded-xl text-rose-400 transition-all"
                  title="Delete Proof"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowPreview(false)} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center bg-slate-50/50 min-h-[300px] max-h-[65vh] overflow-auto">
              {isPdf ? (
                <iframe src={proofUrl} className="w-full h-[60vh] border-none rounded-xl" title="Payment Proof PDF" />
              ) : (
                <img src={proofUrl} alt="Payment Proof" className="max-w-full max-h-[60vh] rounded-xl shadow-lg border border-slate-200 object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Transactions() {
  useOutletContext();
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState([]);
  const [selectAllAll, setSelectAllAll] = useState(false);
  const [latestBatchOnly, setLatestBatchOnly] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [singleBill, setSingleBill] = useState(null);
  const [activeTx, setActiveTx] = useState(null); 
  const [generatingId, setGeneratingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [isWaConfirmOpen, setIsWaConfirmOpen] = useState(false);
  const [waConfirmTxList, setWaConfirmTxList] = useState([]);

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortKey, setSortKey] = useState('date_desc');

  const handleHeaderClick = (column) => {
    let nextKey;
    if (column === 'date') {
      nextKey = sortKey === 'date_desc' ? 'date_asc' : 'date_desc';
    } else if (column === 'bill') {
      nextKey = sortKey === 'bill_desc' ? 'bill_asc' : 'bill_desc';
    } else if (column === 'customer') {
      nextKey = sortKey === 'customer_asc' ? 'customer_desc' : 'customer_asc';
    } else if (column === 'amount') {
      nextKey = sortKey === 'amount_desc' ? 'amount_asc' : 'amount_desc';
    }
    if (nextKey) {
      setSortKey(nextKey);
      setPage(0);
    }
  };

  const renderSortIndicator = (column) => {
    const [by, order] = sortKey.split('_');
    if (by !== column) return null;
    return order === 'desc' ? ' ↓' : ' ↑';
  };

  const duplicateIds = React.useMemo(() => {
    const counts = {};
    data.items.forEach(item => {
      if (item.transaction_id && item.transaction_id !== '--') {
        counts[item.transaction_id] = (counts[item.transaction_id] || 0) + 1;
      }
    });
    return new Set(Object.keys(counts).filter(id => counts[id] > 1));
  }, [data.items]);

  const fetchTransactions = useCallback(async () => {
    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const [by, order] = sortKey.split('_');
      const backendSortBy = by === 'bill' ? 'bill_no' : by;
      const res = await api.get('/transactions/', {
        params: { 
          skip: page * pageSize, 
          limit: pageSize, 
          search, 
          status, 
          latest_batch_only: latestBatchOnly, 
          year: selectedYear,
          sort_by: backendSortBy,
          sort_order: order
        }
      });
      
      setData(res.data);
      setHasMore((page + 1) * pageSize < res.data.total);
    } catch { 
      console.error("Fetch failed"); 
    } finally { 
      setLoading(false); 
      setLoadingMore(false);
    }
  }, [page, pageSize, search, status, latestBatchOnly, selectedYear, sortKey]);

  useEffect(() => {
    api.get('/dashboard/filters').then(res => {
      if (res.data && res.data.years) {
        setYears(res.data.years);
      }
    }).catch(err => console.error("Failed to load filters", err));
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleScroll = (e) => {
    // Scroll pagination disabled in favor of Back/Next buttons
  };

  const handleSearch = (e) => { 
    e.preventDefault(); 
    setPage(0); 
  };
  
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const toggleSelect = (id) => { setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const toggleSelectAll = () => {
    if (selected.length === data.items.length) { setSelected([]); setSelectAllAll(false); }
    else { setSelected(data.items.map(i => i.id)); }
  };

  const handleBulkExport = async () => {
    if (selected.length === 0) {
      alert('Please select entries first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/transactions/bulk-export', 
        { ids: selected }, 
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      const filename = `Zeal_Invoices_${new Date().toISOString().split('T')[0]}.zip`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with a slight delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch {
      alert('Export failed. Please ensure the backend is running and you have selected valid entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkWhatsAppClick = () => {
    if (selected.length === 0) return;
    const txsToConfirm = data.items.filter(item => selected.includes(item.id));
    setWaConfirmTxList(txsToConfirm);
    setIsWaConfirmOpen(true);
  };

  const handleConfirmBulkWhatsApp = async () => {
    setIsWaConfirmOpen(false);
    setSendingWhatsApp(true);
    try {
      const _res = await api.post('/transactions/bulk-whatsapp', { ids: selected });
      setSelected([]);
      navigate('/whatsapp-monitor'); // Redirect to monitor
    } catch {
      alert('Bulk send failed. Ensure WhatsApp service is online.');
    } finally {
      setSendingWhatsApp(false);
    }
  };


  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectAllAll ? data.total : selected.length} entries?`)) return;
    try {
      await api.post('/transactions/bulk-delete', { ids: selectAllAll ? [] : selected, deleteAll: selectAllAll, status, search, latest_batch_only: latestBatchOnly });
      setSelected([]); setSelectAllAll(false); fetchTransactions();
    } catch { alert('Operation failed'); }
  };

  const handleWipeAll = async () => {
    if (!window.confirm("CRITICAL: Wipe entire database?")) return;
    try {
      await api.post('/transactions/bulk-delete', { ids: [], deleteAll: true });
      setSelected([]); setSelectAllAll(false); fetchTransactions();
    } catch { alert('Wipe failed'); }
  };

  const generateInvoice = async (tx) => {
    setGeneratingId(tx.id);
    try {
      const res = await api.post(`/transactions/${tx.id}/generate-invoice`);
      setSingleBill({ url: `${BASE_URL}${res.data.url}?t=${Date.now()}`, name: tx.name });
      setActiveTx(tx);
      fetchTransactions();
    } catch { alert('Failed to generate'); }
    finally { setGeneratingId(null); }
  };

  const allSelected = data.items.length > 0 && selected.length === data.items.length;

  return (
    <>
      {isCreateModalOpen && <CreateModal onClose={() => setIsCreateModalOpen(false)} onSave={() => { setIsCreateModalOpen(false); fetchTransactions(); }} />}
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} />}
      {editingTx && <EditModal tx={editingTx} onClose={() => setEditingTx(null)} onSave={() => { setEditingTx(null); fetchTransactions(); }} />}
      <WhatsAppConfirmationModal 
        isOpen={isWaConfirmOpen} 
        onClose={() => setIsWaConfirmOpen(false)} 
        onConfirm={handleConfirmBulkWhatsApp} 
        transactions={waConfirmTxList} 
      />
      
      {singleBill && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center border border-emerald-100"><FileText className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <span className="text-sm font-black tracking-tight text-slate-900 block">{singleBill.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Bill Statement</span>
                </div>
              </div>
              <button onClick={() => setSingleBill(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <iframe src={singleBill.url} className="w-full flex-1 border-none bg-slate-50/50" title="Preview" />
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => generateInvoice(activeTx)} 
                disabled={generatingId === activeTx?.id}
                className="px-5 py-2 text-emerald-600 border border-emerald-100 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                {generatingId === activeTx?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                Sync
              </button>
              <a href={singleBill.url} download className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-8 pb-32">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Performance Ledger</h1>
            <div className="flex items-center gap-2 mt-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none">Database Online & Syncing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setLatestBatchOnly(!latestBatchOnly); setPage(0); }}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all ${latestBatchOnly ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'}`}
            >
              Latest Upload
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </button>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-5 py-2 text-[11px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-500 rounded-lg hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button onClick={handleWipeAll} className="px-4 py-2 text-[11px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-lg transition-all">Clear All</button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="bg-emerald-50/40 backdrop-blur-sm border-t border-b border-emerald-100/50 px-8 py-4 flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">
                  {selectAllAll ? `All ${data.total} records secured` : `${selected.length} entries selected`}
                </span>
              </div>
              {!selectAllAll && data.total > data.items.length && (
                <button onClick={() => setSelectAllAll(true)} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 underline underline-offset-4 decoration-emerald-200 decoration-2 transition-all">
                  Commit all {data.total} to scope
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkWhatsAppClick}
                disabled={sendingWhatsApp}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50"
              >
                {sendingWhatsApp ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                Send Bills
              </button>
              <button 
                onClick={handleBulkExport}
                disabled={loading}
                className="px-6 py-2.5 bg-white text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Download ZIP
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="px-6 py-2.5 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
              >
                Destroy Logs
              </button>
              <button 
                onClick={() => { setSelected([]); setSelectAllAll(false); }}
                className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <input 
              type="text" placeholder="Search by name, phone, transaction ID..." 
              value={search} onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-12 py-2.5 text-[13px] font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400"
            />
            {search && (
              <button 
                type="button"
                onClick={() => { setSearch(''); setPage(0); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          <div className="relative w-full md:w-48">
            <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setPage(0); }} className="w-full px-4 py-2.5 text-[12px] font-black bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer hover:border-emerald-400 transition-all appearance-none text-slate-700">
              <option value="All">All FY</option>
              {years.map(y => <option key={y} value={y}>{y.includes('-') ? `FY ${y}` : y}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          </div>
          <div className="relative w-full md:w-48">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="w-full px-4 py-2.5 text-[12px] font-black bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer hover:border-emerald-400 transition-all appearance-none text-slate-700">
              <option value="All">All Transactions</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          </div>
          <div className="relative w-full md:w-48">
            <select value={sortKey} onChange={(e) => { setSortKey(e.target.value); setPage(0); }} className="w-full px-4 py-2.5 text-[12px] font-black bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer hover:border-emerald-400 transition-all appearance-none text-slate-700">
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
              <option value="bill_desc">Bill No: High to Low</option>
              <option value="bill_asc">Bill No: Low to High</option>
              <option value="customer_asc">Customer: A to Z</option>
              <option value="customer_desc">Customer: Z to A</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {loading && page === 0 ? (
            <div className="flex flex-col justify-center items-center py-40 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
              <span className="text-[11px] font-black tracking-widest uppercase">Loading Ledger...</span>
            </div>
          ) : (
            <>
              <div 
                className="overflow-auto max-h-[calc(100vh-320px)] relative"
                onScroll={handleScroll}
              >
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 w-10 text-center border-r border-slate-200">
                        <button onClick={toggleSelectAll} className="p-1 text-emerald-600 hover:text-emerald-800 transition-all">
                          {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th onClick={() => handleHeaderClick('date')} className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none">
                        <span className="flex items-center gap-1">
                          Date{renderSortIndicator('date')}
                        </span>
                      </th>
                      <th onClick={() => handleHeaderClick('bill')} className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none">
                        <span className="flex items-center gap-1">
                          Bill No.{renderSortIndicator('bill')}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap select-none">FY</th>
                      <th onClick={() => handleHeaderClick('customer')} className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none">
                        <span className="flex items-center gap-1">
                          Customer{renderSortIndicator('customer')}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 select-none">Phone</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 select-none">Transaction ID</th>
                      <th onClick={() => handleHeaderClick('amount')} className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none">
                        <span className="flex items-center gap-1">
                          Total{renderSortIndicator('amount')}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Paid</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Balance</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Items</th>
                      <th className="px-4 py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Payment Proof</th>
                      <th className="px-4 py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((tx) => {
                      const isSelected = selected.includes(tx.id);
                      const isDuplicate = tx.transaction_id && duplicateIds.has(tx.transaction_id);
                      return (
                        <tr key={tx.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/30' : isDuplicate ? 'bg-rose-50/60' : 'hover:bg-slate-50/50'}`}>
                          <td className={`px-4 py-2.5 text-center border-r border-slate-100 ${isDuplicate ? 'border-r-rose-200' : ''}`}>
                            <button onClick={() => toggleSelect(tx.id)} className={`p-1 transition-all ${isSelected ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-600'}`}>
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                           <td className="px-4 py-2.5 text-[12px] font-black text-slate-600 border-r border-slate-100">{tx.date || '--'}</td>
                           <td className="px-4 py-2.5 text-[12px] font-black text-slate-900 border-r border-slate-100">{getBillNumber(tx)}</td>
                           <td className="px-4 py-2.5 text-[12px] font-black text-slate-600 border-r border-slate-100 whitespace-nowrap">{getFinancialYear(tx)}</td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <span className="text-[13px] font-black text-slate-900">{tx.name}</span>
                          </td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <span className="text-[12px] font-black text-slate-600">{tx.phone}</span>
                          </td>
                          <td className={`px-4 py-2.5 border-r border-slate-100 ${isDuplicate ? 'border-r-rose-200' : ''}`}>
                             <div className="flex items-center gap-2">
                                <div className={`font-mono text-[11px] font-black truncate max-w-[160px] ${isDuplicate ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {tx.transaction_id}
                                </div>
                                {isDuplicate && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                             </div>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] font-black text-slate-900 border-r border-slate-100">₹{Number(tx.total_amount || 0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-[12px] font-black text-emerald-600 border-r border-slate-100">
                            ₹{Number(tx.paid_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] font-black border-r border-slate-100">
                            {(tx.balance !== undefined && tx.balance !== null) ? (
                              <span className={tx.balance > 0 ? 'text-rose-500' : tx.balance < 0 ? 'text-blue-500' : 'text-slate-400'}>
                                {tx.balance > 0 ? 'Due: ' : tx.balance < 0 ? 'Extra: ' : ''}
                                ₹{Math.abs(Number(tx.balance)).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-slate-300">₹0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <p className="text-[12px] font-black text-slate-600 truncate max-w-[200px]" title={tx.product}>{tx.product || '-'}</p>
                          </td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <PaymentProofCell tx={tx} onRefresh={fetchTransactions} />
                          </td>
                          <td className="px-4 py-2.5 border-l border-slate-100">
                            <div className="flex items-center justify-center gap-3">
                              {generatingId === tx.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                              ) : (
                                <button 
                                  onClick={() => {
                                    setActiveTx(tx);
                                    tx.invoice_url ? setSingleBill({ url: `${BASE_URL}${tx.invoice_url}?t=${Date.now()}`, name: tx.name }) : generateInvoice(tx);
                                  }} 
                                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded transition-all ${tx.invoice_url ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                                  title={tx.invoice_url ? "View Bill" : "Generate Bill"}
                                >
                                  View
                                </button>
                              )}
                              <button onClick={() => setEditingTx(tx)} className="text-slate-400 hover:text-emerald-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={async () => { 
                                if(window.confirm('Are you sure you want to delete this entry?')) { 
                                  try {
                                    await api.delete(`/transactions/${tx.id}`); 
                                    fetchTransactions(); 
                                  } catch {
                                    alert('Failed to delete transaction. Please try again.');
                                  }
                                } 
                              }} className="text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-10 py-4 flex items-center justify-between bg-slate-50 border-t border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Showing {data.items.length > 0 ? (page * pageSize + 1) : 0} - {Math.min((page + 1) * pageSize, data.total)} of {data.total} transactions</span>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (page > 0) setPage(p => p - 1);
                    }}
                    disabled={page === 0 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-300 disabled:opacity-40 disabled:hover:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm text-slate-600 font-bold uppercase text-[10px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-emerald-500" />
                    Back
                  </button>

                  <span className="text-[10px] font-bold text-slate-500">
                    Page {page + 1} of {Math.ceil(data.total / pageSize) || 1}
                  </span>

                  <button
                    onClick={() => {
                      if ((page + 1) * pageSize < data.total) setPage(p => p + 1);
                    }}
                    disabled={(page + 1) * pageSize >= data.total || loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-300 disabled:opacity-40 disabled:hover:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm text-slate-600 font-bold uppercase text-[10px]"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
