import { useState, useEffect } from 'react';
import { 
    BookOpen, 
    FileText, 
    Folder as FolderIcon, 
    Plus, 
    Search, 
    Pin, 
    History, 
    Edit3, 
    Trash2, 
    Download, 
    Eye, 
    Check, 
    Clock, 
    User, 
    Upload, 
    ChevronRight, 
    X, 
    Sparkles,
    FileCode,
    FileSpreadsheet,
    FileCheck
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Knowledge = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('wiki'); // 'wiki' or 'documents'
    
    // Wiki states
    const [wikiPages, setWikiPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [loadingWiki, setLoadingWiki] = useState(true);
    const [wikiSearch, setWikiSearch] = useState('');
    const [isEditingWiki, setIsEditingWiki] = useState(false);
    const [wikiForm, setWikiForm] = useState({ title: '', content: '', parent_page: null, is_public: true });
    const [showNewWikiModal, setShowNewWikiModal] = useState(false);
    
    // Versions modal
    const [showVersionsModal, setShowVersionsModal] = useState(false);
    const [pageVersions, setPageVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);

    // Documents states
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [docSearch, setDocSearch] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newDoc, setNewDoc] = useState({ title: '', description: '', category: 'PROJECT_DOC', file: null });

    useEffect(() => {
        fetchWikiPages();
        fetchDocuments();
    }, []);

    const fetchWikiPages = async () => {
        try {
            setLoadingWiki(true);
            const res = await api.get('/knowledge/wiki/');
            const pages = res.data.results || res.data || [];
            setWikiPages(pages);
            if (pages.length > 0 && !selectedPage) {
                setSelectedPage(pages[0]);
            }
        } catch (err) {
            console.error('Failed to fetch wiki pages:', err);
        } finally {
            setLoadingWiki(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoadingDocs(true);
            const res = await api.get('/knowledge/documents/');
            setDocuments(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleSelectPage = (page) => {
        setSelectedPage(page);
        setIsEditingWiki(false);
    };

    const handleTogglePin = async (slug) => {
        try {
            const res = await api.post(`/knowledge/wiki/${slug}/toggle_pin/`);
            setWikiPages(prev => prev.map(p => p.slug === slug ? { ...p, is_pinned: res.data.is_pinned } : p));
            if (selectedPage?.slug === slug) {
                setSelectedPage(prev => ({ ...prev, is_pinned: res.data.is_pinned }));
            }
            showToast(res.data.message || 'Pin updated', 'success');
        } catch (err) {
            showToast('Failed to toggle pin', 'error');
        }
    };

    const handleSaveWiki = async (e) => {
        e.preventDefault();
        try {
            if (isEditingWiki && selectedPage) {
                const res = await api.patch(`/knowledge/wiki/${selectedPage.slug}/`, {
                    title: wikiForm.title,
                    content: wikiForm.content
                });
                setSelectedPage(res.data);
                setWikiPages(prev => prev.map(p => p.slug === selectedPage.slug ? res.data : p));
                setIsEditingWiki(false);
                showToast('Article updated!', 'success');
            } else {
                const res = await api.post('/knowledge/wiki/', wikiForm);
                setWikiPages([res.data, ...wikiPages]);
                setSelectedPage(res.data);
                setShowNewWikiModal(false);
                setWikiForm({ title: '', content: '', parent_page: null, is_public: true });
                showToast('New wiki article published!', 'success');
            }
        } catch (err) {
            console.error('Save wiki failed:', err);
            showToast('Failed to save article', 'error');
        }
    };

    const handleDeleteWiki = async (slug) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;
        try {
            await api.delete(`/knowledge/wiki/${slug}/`);
            const updated = wikiPages.filter(p => p.slug !== slug);
            setWikiPages(updated);
            setSelectedPage(updated[0] || null);
            showToast('Article deleted', 'success');
        } catch (err) {
            showToast('Failed to delete article', 'error');
        }
    };

    const handleOpenVersions = async (slug) => {
        setShowVersionsModal(true);
        setLoadingVersions(true);
        try {
            const res = await api.get(`/knowledge/wiki/${slug}/versions/`);
            setPageVersions(res.data || []);
        } catch (err) {
            showToast('Failed to load version history', 'error');
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleRestoreVersion = async (versionId) => {
        try {
            const res = await api.post(`/knowledge/wiki/${selectedPage.slug}/restore_version/`, {
                version_id: versionId
            });
            setSelectedPage(res.data);
            setWikiPages(prev => prev.map(p => p.slug === selectedPage.slug ? res.data : p));
            setShowVersionsModal(false);
            showToast('Version restored successfully!', 'success');
        } catch (err) {
            showToast('Failed to restore version', 'error');
        }
    };

    const handleUploadDoc = async (e) => {
        e.preventDefault();
        if (!newDoc.file) {
            showToast('Please select a file to upload', 'info');
            return;
        }
        const formData = new FormData();
        formData.append('title', newDoc.title);
        formData.append('description', newDoc.description);
        formData.append('category', newDoc.category);
        formData.append('file', newDoc.file);

        try {
            const res = await api.post('/knowledge/documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocuments([res.data, ...documents]);
            setShowUploadModal(false);
            setNewDoc({ title: '', description: '', category: 'PROJECT_DOC', file: null });
            showToast('Document uploaded successfully!', 'success');
        } catch (err) {
            console.error('Doc upload failed:', err);
            showToast('Upload failed', 'error');
        }
    };

    const filteredWikiPages = wikiPages.filter(p =>
        p.title.toLowerCase().includes(wikiSearch.toLowerCase()) ||
        p.content.toLowerCase().includes(wikiSearch.toLowerCase())
    );

    const filteredDocs = documents.filter(d =>
        d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(docSearch.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-sm">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#172B4D]">Knowledge Base & Team Wiki</h1>
                        <p className="text-[#5E6C84] text-sm mt-0.5">
                            Centralized project documentation, architectural specs, versioned guides, and assets.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'wiki' ? (
                        <button
                            onClick={() => {
                                setWikiForm({ title: '', content: '', parent_page: null, is_public: true });
                                setShowNewWikiModal(true);
                            }}
                            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Plus size={16} /> New Wiki Page
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Upload size={16} /> Upload Document
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#DFE1E6] gap-8">
                <button
                    onClick={() => setActiveTab('wiki')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
                        activeTab === 'wiki' ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'
                    }`}
                >
                    <FileText size={16} /> Documentation Wiki ({wikiPages.length})
                    {activeTab === 'wiki' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC]" />}
                </button>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
                        activeTab === 'documents' ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'
                    }`}
                >
                    <FolderIcon size={16} /> Document Vault & Assets ({documents.length})
                    {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC]" />}
                </button>
            </div>

            {/* TAB 1: WIKI PAGES */}
            {activeTab === 'wiki' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Sidebar: Pages List */}
                    <div className="lg:col-span-4 bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-4 space-y-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-[#5E6C84]" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={wikiSearch}
                                onChange={e => setWikiSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC]"
                            />
                        </div>

                        {loadingWiki ? (
                            <div className="py-8 text-center text-xs text-[#5E6C84]">Loading articles...</div>
                        ) : filteredWikiPages.length === 0 ? (
                            <div className="py-8 text-center text-xs text-[#5E6C84] border-2 border-dashed border-[#DFE1E6] rounded-lg">
                                No articles found. Click "New Wiki Page" to create one.
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
                                {filteredWikiPages.map(page => {
                                    const isSelected = selectedPage?.slug === page.slug;
                                    return (
                                        <div
                                            key={page.slug}
                                            onClick={() => handleSelectPage(page)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2 ${
                                                isSelected 
                                                    ? 'bg-blue-50/80 border border-blue-200 text-[#0052CC]' 
                                                    : 'hover:bg-slate-50 text-[#172B4D]'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <FileText size={16} className={`shrink-0 mt-0.5 ${isSelected ? 'text-[#0052CC]' : 'text-[#5E6C84]'}`} />
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-semibold truncate leading-tight">{page.title}</h4>
                                                    <p className="text-[11px] text-[#5E6C84] mt-1 flex items-center gap-2">
                                                        <span>{new Date(page.updated_at).toLocaleDateString()}</span>
                                                        {page.view_count > 0 && <span>• {page.view_count} views</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            {page.is_pinned && (
                                                <Pin size={13} className="text-amber-500 fill-amber-500 shrink-0 mt-1" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Area: Article Reader & Editor */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-6">
                        {selectedPage ? (
                            isEditingWiki ? (
                                /* EDIT FORM */
                                <form onSubmit={handleSaveWiki} className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <h3 className="font-bold text-[#172B4D] text-lg">Edit Article</h3>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingWiki(false)}
                                                className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-3 py-1.5 bg-[#0052CC] text-white rounded-lg text-xs font-semibold hover:bg-[#0747A6]"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Article Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={wikiForm.title}
                                            onChange={e => setWikiForm({ ...wikiForm, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Markdown Content</label>
                                        <textarea
                                            required
                                            rows={14}
                                            value={wikiForm.content}
                                            onChange={e => setWikiForm({ ...wikiForm, content: e.target.value })}
                                            className="w-full p-3 border rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </form>
                            ) : (
                                /* ARTICLE VIEWER */
                                <div className="space-y-6">
                                    {/* Action Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DFE1E6] gap-3">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-bold text-[#172B4D]">{selectedPage.title}</h2>
                                            <div className="flex items-center gap-3 text-xs text-[#5E6C84]">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> Last updated {new Date(selectedPage.updated_at).toLocaleString()}
                                                </span>
                                                {selectedPage.last_edited_by_details && (
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} /> by {selectedPage.last_edited_by_details.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleTogglePin(selectedPage.slug)}
                                                className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                                                    selectedPage.is_pinned 
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                        : 'hover:bg-slate-50 text-[#5E6C84]'
                                                }`}
                                                title={selectedPage.is_pinned ? 'Unpin' : 'Pin to top'}
                                            >
                                                <Pin size={15} className={selectedPage.is_pinned ? 'fill-amber-500 text-amber-500' : ''} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenVersions(selectedPage.slug)}
                                                className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-[#5E6C84] hover:bg-slate-50 flex items-center gap-1.5"
                                                title="View revision history"
                                            >
                                                <History size={14} /> History
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setWikiForm({
                                                        title: selectedPage.title,
                                                        content: selectedPage.content,
                                                        parent_page: selectedPage.parent_page,
                                                        is_public: selectedPage.is_public
                                                    });
                                                    setIsEditingWiki(true);
                                                }}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWiki(selectedPage.slug)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete article"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Article Body */}
                                    <div className="prose max-w-none text-[#172B4D] leading-relaxed whitespace-pre-line text-sm font-sans">
                                        {selectedPage.content}
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="py-16 text-center text-[#5E6C84] text-sm">
                                Select an article from the left or create a new wiki page.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: DOCUMENTS VAULT */}
            {activeTab === 'documents' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="relative max-w-md w-full">
                            <Search size={16} className="absolute left-3 top-2.5 text-[#5E6C84]" />
                            <input
                                type="text"
                                placeholder="Search documents & assets..."
                                value={docSearch}
                                onChange={e => setDocSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC]"
                            />
                        </div>
                    </div>

                    {loadingDocs ? (
                        <div className="py-12 text-center text-xs text-[#5E6C84]">Loading documents...</div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="py-12 text-center bg-white border-2 border-dashed border-[#DFE1E6] rounded-xl p-8">
                            <FolderIcon size={32} className="mx-auto text-blue-500 mb-3" />
                            <h3 className="text-base font-bold text-[#172B4D]">No Documents Uploaded Yet</h3>
                            <p className="text-sm text-[#5E6C84] mt-1 max-w-md mx-auto">
                                Securely store architectural diagrams, product requirement PDFs, and shared assets.
                            </p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="mt-4 px-4 py-2 bg-[#0052CC] text-white hover:bg-[#0747A6] rounded-lg text-xs font-bold"
                            >
                                Upload First Document
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredDocs.map(doc => (
                                <div key={doc.id} className="bg-white p-5 rounded-xl border border-[#DFE1E6] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <FileText size={20} />
                                            </div>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                                                v{doc.version || 1}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#172B4D] text-base truncate">{doc.title}</h3>
                                            <p className="text-xs text-[#5E6C84] mt-1 line-clamp-2">{doc.description || 'No description provided.'}</p>
                                        </div>
                                        <div className="text-[11px] text-[#5E6C84] flex items-center justify-between border-t pt-2">
                                            <span>{Math.round((doc.file_size || 0) / 1024)} KB</span>
                                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2">
                                        {doc.file_url ? (
                                            <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <Download size={14} /> Download Asset
                                            </a>
                                        ) : (
                                            <button disabled className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed">
                                                No Attachment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: New Wiki Article */}
            {showNewWikiModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-[#172B4D] text-base flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" /> Publish New Wiki Page
                            </h3>
                            <button onClick={() => setShowNewWikiModal(false)} className="p-1 hover:bg-slate-200 rounded">
                                <X size={18} className="text-[#5E6C84]" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveWiki} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Architecture Overview & API Contracts"
                                    value={wikiForm.title}
                                    onChange={e => setWikiForm({ ...wikiForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Content (Markdown)</label>
                                <textarea
                                    required
                                    rows={10}
                                    placeholder="Write your article content here..."
                                    value={wikiForm.content}
                                    onChange={e => setWikiForm({ ...wikiForm, content: e.target.value })}
                                    className="w-full p-3 border rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowNewWikiModal(false)}
                                    className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold"
                                >
                                    Publish Article
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Upload Document */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-[#172B4D] text-base flex items-center gap-2">
                                <Upload size={18} className="text-blue-600" /> Upload Document
                            </h3>
                            <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-slate-200 rounded">
                                <X size={18} className="text-[#5E6C84]" />
                            </button>
                        </div>
                        <form onSubmit={handleUploadDoc} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Q4 System Roadmap Spec"
                                    value={newDoc.title}
                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief description of this file..."
                                    value={newDoc.description}
                                    onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Select File</label>
                                <input
                                    type="file"
                                    required
                                    onChange={e => setNewDoc({ ...newDoc, file: e.target.files[0] })}
                                    className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold"
                                >
                                    Upload Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Version History */}
            {showVersionsModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-[#172B4D] text-base flex items-center gap-2">
                                <History size={18} className="text-blue-600" /> Revision History: {selectedPage?.title}
                            </h3>
                            <button onClick={() => setShowVersionsModal(false)} className="p-1 hover:bg-slate-200 rounded">
                                <X size={18} className="text-[#5E6C84]" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingVersions ? (
                                <div className="py-8 text-center text-xs text-[#5E6C84]">Loading revisions...</div>
                            ) : pageVersions.length === 0 ? (
                                <div className="py-8 text-center text-xs text-[#5E6C84]">
                                    No previous revisions recorded. Revisions are created every time an article is edited.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                    {pageVersions.map((v, i) => (
                                        <div key={v.id} className="p-3 border rounded-lg flex items-center justify-between text-xs hover:bg-slate-50">
                                            <div>
                                                <span className="font-bold text-[#172B4D]">Revision #{pageVersions.length - i}</span>
                                                <div className="text-[#5E6C84] mt-0.5">{new Date(v.created_at).toLocaleString()}</div>
                                            </div>
                                            <button
                                                onClick={() => handleRestoreVersion(v.id)}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-xs transition-colors"
                                            >
                                                Restore This Version
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Knowledge;
