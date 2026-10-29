import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService, type Complaint } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Plumbing',
  'Electrical',
  'Housekeeping',
  'WiFi / Network',
  'Food & Mess',
  'Air Conditioning',
  'Security & Gate',
  'Other',
];

export const ComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showRaiseForm, setShowRaiseForm] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('medium');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const list = await tenantService.getComplaints();
        setComplaints(list);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Please enter both subject and description.');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | undefined = undefined;
      if (selectedFile) {
        setUploadingPhoto(true);
        photoUrl = await tenantService.uploadPhoto(selectedFile);
        setUploadingPhoto(false);
      }

      await tenantService.raiseComplaint({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        photoUrl,
      });

      setSuccessMsg('Complaint registered successfully! The property manager has been notified.');
      setSubject('');
      setDescription('');
      setSelectedFile(null);
      setShowRaiseForm(false);
      loadComplaints();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (selectedCategory === 'All') return true;
    return c.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={loadComplaints}
            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            title="Refresh Complaints"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowRaiseForm(!showRaiseForm)}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showRaiseForm ? 'View Complaints' : 'New Complaint'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Raise Complaint Form */}
      {showRaiseForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <MessageSquareWarning className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-brandText">Raise a Maintenance Issue</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:bg-white focus:outline-none"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Subject</label>
            <input
              type="text"
              placeholder="e.g. Bathroom tap leaking, WiFi router blinking red"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText placeholder:text-gray-400 focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:bg-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Upload Photo (Optional)</label>
              <label className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100">
                <Upload className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">{selectedFile ? selectedFile.name : 'Choose Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Provide specific details such as room area, how long the issue has persisted, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs font-medium text-brandText placeholder:text-gray-400 focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowRaiseForm(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
            >
              {(submitting || uploadingPhoto) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{uploadingPhoto ? 'Uploading photo...' : submitting ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Complaints Feed */
        <div className="space-y-3">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all tap-target ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
              <p className="text-xs font-medium text-gray-500">Loading complaints...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-brandText">No Complaints Filed</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {isLinkedTenant
                  ? 'Your room has no active complaints. If anything requires fixing, tap New Complaint above.'
                  : 'Sign in to an active PG stay to file and track maintenance complaints.'}
              </p>
              <button
                onClick={() => setShowRaiseForm(true)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
              >
                Raise a Complaint
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                          {item.category || 'General'}
                        </span>
                        {item.ticketNumber && (
                          <span className="text-[10px] font-semibold text-gray-400">
                            #{item.ticketNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-brandText mt-1">{item.subject}</h4>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'resolved' || item.status === 'closed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status === 'resolved' || item.status === 'closed'
                        ? 'Resolved'
                        : item.status === 'in_progress'
                        ? 'In Progress'
                        : 'Pending'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>

                  {item.photoUrl && (
                    <a
                      href={item.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>View Attached Photo</span>
                    </a>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-50 pt-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="uppercase font-bold tracking-wider">{item.priority} Priority</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
