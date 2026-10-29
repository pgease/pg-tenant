import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Plus,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Image,
} from 'lucide-react';
import { tenantService, type Complaint } from '../../services/tenantService';

interface ComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleanliness', 'WiFi & Internet', 'Appliance', 'Food & Dining', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const ComplaintsModal: React.FC<ComplaintsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'raise'>('list');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchComplaints = () => {
    setLoading(true);
    tenantService
      .getComplaints()
      .then((res) => setComplaints(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchComplaints();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !description.trim()) {
      setError('Please provide both subject and description for your issue.');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';
      if (selectedFile) {
        photoUrl = await tenantService.uploadPhoto(selectedFile);
      }

      await tenantService.raiseComplaint({
        subject,
        category,
        priority,
        description,
        photoUrl,
      });

      setSuccessMsg('Complaint raised successfully. Caretaker has been assigned.');
      setSubject('');
      setDescription('');
      setSelectedFile(null);

      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('list');
        fetchComplaints();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to raise complaint. Please try again.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Complaints & Repairs</h2>
              <p className="text-[11px] text-brandText-muted">Raise & Track Maintenance Tickets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 bg-gray-50/60 p-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-primary shadow-sm'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Active & Past ({complaints.length})
          </button>

          <button
            onClick={() => setActiveTab('raise')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'raise'
                ? 'bg-primary text-white shadow-sm'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Raise Complaint
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {activeTab === 'list' && (
            <div className="space-y-3 animate-fade-in">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-xs text-brandText-muted">Loading complaints...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="py-12 text-center text-brandText-muted">
                  <Wrench className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-brandText">No Complaints Raised</p>
                  <p className="text-xs mt-1">Everything looks peaceful! Tap 'Raise Complaint' if something breaks.</p>
                </div>
              ) : (
                complaints.map((item) => {
                  const isResolved = item.status === 'resolved' || item.status === 'closed';
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded-full">
                            {item.category || 'Maintenance'}
                          </span>
                          <h4 className="text-xs font-bold text-brandText mt-1.5 leading-snug">
                            {item.subject}
                          </h4>
                        </div>

                        <span
                          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isResolved ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {item.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-brandText-muted leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {item.photoUrl && (
                        <div className="pt-1">
                          <a
                            href={item.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            <Image className="h-3 w-3" />
                            View Attached Photo
                          </a>
                        </div>
                      )}

                      <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[10px] text-brandText-muted">
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.priority && (
                          <span className="capitalize font-semibold text-brandText">
                            Priority: {item.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'raise' && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-xs text-teal-800 border border-teal-200">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Issue Title / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bathroom tap leaking, WiFi disconnects"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Urgency / Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText capitalize focus:border-primary focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Describe the Issue
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain when it started and what is needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-brandText focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Attach Photo (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-3 cursor-pointer hover:border-primary hover:bg-teal-50/30 transition-all">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-brandText truncate">
                    {selectedFile ? selectedFile.name : 'Take or select photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50 hover:bg-primary-dark active:scale-[0.98] transition-all tap-target"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Complaint...
                  </>
                ) : (
                  'Submit Maintenance Complaint'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
