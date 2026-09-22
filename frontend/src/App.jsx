import { useEffect, useState, useRef, useCallback } from 'react';
import api from './api';
import ObjectDropdown from './components/ObjectDropdown';
import RecordTable from './components/RecordTable';
import RecordModal from './components/RecordModal';
import Sidebar from './components/Sidebar';
import ProfileHeader from './components/ProfileHeader';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [object, setObject] = useState('Account');
  const [records, setRecords] = useState([]);
  const [fields, setFields] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const loaderRef = useRef(null);
  const loadingRef = useRef(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/oauth/status')
      .then(r => {
        setLoggedIn(r.data.loggedIn);
        if (r.data.user) setUser(r.data.user);
      })
      .catch(() => setLoggedIn(false));
  }, []);

  const loadRecords = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    if (!reset && !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');
    const currentOffset = reset ? 0 : offset;
    try {
      const { data } = await api.get(`/api/${object}?offset=${currentOffset}`);
      setRecords(prev => reset ? data.records : [...prev, ...data.records]);
      setFields(data.fields);
      setOffset(currentOffset + 20);
      setHasMore(data.records.length === 20);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load records');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [object, offset, hasMore]);

  useEffect(() => {
    if (!loggedIn) return;
    setRecords([]); setOffset(0); setHasMore(true); setSearchTerm(''); setCurrentPage(1);
    loadRecords(true);
    // eslint-disable-next-line
  }, [object, loggedIn]);

  useEffect(() => {
    if (!loggedIn || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) loadRecords();
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loggedIn, hasMore, loadRecords]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, pageSize]);

  const handleSave = async (formData) => {
    if (modal.mode === 'create') {
      await api.post(`/api/${object}`, formData);
      showToast(`${object} created successfully!`, 'success');
    } else {
      await api.patch(`/api/${object}/${modal.record.Id}`, formData);
      showToast(`${object} updated successfully!`, 'success');
    }
    setModal(null);
    setRecords([]); setOffset(0); setHasMore(true);
    loadRecords(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record permanently?')) return;
    try {
      await api.delete(`/api/${object}/${id}`);
      setRecords(prev => prev.filter(r => r.Id !== id));
      showToast('Record deleted!', 'success');
    } catch (err) {
      showToast('Delete failed: ' + (err.response?.data?.error?.[0]?.message || err.message), 'error');
    }
  };

  const handleLogout = async () => {
    await api.get('/oauth/logout');
    setLoggedIn(false);
    setUser(null);
    setRecords([]);
    setSidebarOpen(false);
  };

  const filteredRecords = searchTerm
    ? records.filter(r => Object.values(r).some(v =>
        String(v).toLowerCase().includes(searchTerm.toLowerCase())))
    : records;

  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // ============ LOGIN ============
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <div className="bg-white border-2 border-red-100 p-8 sm:p-10 rounded-2xl shadow-2xl text-center max-w-md w-full relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-60"></div>

          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Salesforce CRUD</h1>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">Manage Account, Opportunity, Lead, Contact & Case</p>
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/oauth/login`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold shadow-lg shadow-red-500/30 transition-all transform hover:scale-105 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login with Salesforce
            </a>
            <p className="text-red-600/70 text-xs mt-6">Secure OAuth 2.0 Authentication</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN APP ============
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 sm:px-6 py-3 rounded-lg shadow-lg text-white font-medium text-sm ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 capitalize truncate">
                  {activeTab === 'records' ? 'Records' : activeTab}
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block truncate">
                  {activeTab === 'dashboard' && 'Overview of your Salesforce data'}
                  {activeTab === 'records' && 'Manage your Salesforce records'}
                  {activeTab === 'settings' && 'Application settings'}
                  {activeTab === 'profile' && 'Your account information'}
                </p>
              </div>
            </div>

            <ProfileHeader user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto bg-gray-50">
          {/* ==== DASHBOARD ==== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:border-red-300 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Total Records</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:border-red-300 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Current Object</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">{object}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:border-red-300 hover:shadow-md transition sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Auth Method</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">OAuth 2.0</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button onClick={() => setActiveTab('records')} className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-medium shadow-sm">
                    View Records
                  </button>
                  <button onClick={() => { setActiveTab('records'); setTimeout(() => setModal({ mode: 'create' }), 100); }} className="px-3 sm:px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition text-xs sm:text-sm font-medium">
                    Create New Record
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==== RECORDS ==== */}
          {activeTab === 'records' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Object:</label>
                      <ObjectDropdown value={object} onChange={setObject} />
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setModal({ mode: 'create' })}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-5 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-sm transition text-sm w-full lg:w-auto"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New {object}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-3 sm:p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <RecordTable
                fields={fields}
                records={paginatedRecords}
                onEdit={(r) => setModal({ mode: 'edit', record: r })}
                onDelete={handleDelete}
              />

              <div className="bg-white rounded-xl border border-gray-200 p-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Showing <span className="font-semibold text-red-600">{totalRecords === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-red-600">{Math.min(endIndex, totalRecords)}</span> of <span className="font-semibold text-red-600">{totalRecords}</span>
                  {searchTerm && <span className="text-gray-400 ml-1">(filtered)</span>}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="text-xs sm:text-sm bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>

                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 sm:p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg disabled:opacity-30 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 sm:p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg disabled:opacity-30 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <span className="text-xs sm:text-sm text-gray-600 px-2">
                    Page <span className="font-semibold text-red-600">{currentPage}</span> / {totalPages}
                  </span>

                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg disabled:opacity-30 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg disabled:opacity-30 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div ref={loaderRef} className="h-4"></div>

              {loading && (
                <div className="flex items-center justify-center py-4 gap-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm">Loading more records...</span>
                </div>
              )}
            </div>
          )}

          {/* ==== SETTINGS ==== */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 max-w-2xl shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Settings</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 gap-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">API Endpoint</p>
                    <p className="text-xs text-gray-500">Backend server URL</p>
                  </div>
                  <code className="text-xs bg-red-50 border border-red-200 px-2 py-1 rounded text-red-700 self-start sm:self-auto break-all">
                    {import.meta.env.VITE_API_URL || 'http://localhost:5000'}
                  </code>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">OAuth Provider</p>
                    <p className="text-xs text-gray-500">Authentication service</p>
                  </div>
                  <span className="text-sm text-gray-700">Salesforce</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Version</p>
                    <p className="text-xs text-gray-500">Application version</p>
                  </div>
                  <span className="text-sm text-gray-700">1.0.0</span>
                </div>
              </div>
            </div>
          )}

          {/* ==== PROFILE ==== */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 max-w-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-red-500/30 flex-shrink-0">
                  {(user?.name || 'User').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{user?.name || 'User'}</h3>
                  <p className="text-gray-500 text-sm break-all">{user?.email || 'email@example.com'}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900 text-sm">{user?.name || '—'}</p>
                </div>
                <div className="py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 text-sm break-all">{user?.email || '—'}</p>
                </div>
                <div className="py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="font-medium text-gray-900 text-xs break-all">{user?.userId || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {modal && (
        <RecordModal
          mode={modal.mode}
          fields={fields}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}