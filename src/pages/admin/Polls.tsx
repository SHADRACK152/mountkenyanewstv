import { useState, useEffect } from 'react';
import { Plus, Vote, Trash2, Edit2, Eye, EyeOff, Users, BarChart3, X, Image, Calendar, CheckCircle2, XCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface PollOption {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  votes_count: number;
  display_order: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  type: 'voting' | 'nomination';
  status: 'active' | 'closed' | 'draft';
  start_date: string;
  end_date?: string;
  show_results: boolean;
  allow_multiple: boolean;
  created_at: string;
  options: PollOption[];
  total_votes: number;
}

interface NewOption {
  title: string;
  description: string;
  image_url: string;
}

export default function AdminPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVotesModal, setShowVotesModal] = useState<string | null>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [loadingVotes, setLoadingVotes] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'voting' as 'voting' | 'nomination',
    end_date: '',
    show_results: true,
  });
  const [options, setOptions] = useState<NewOption[]>([
    { title: '', description: '', image_url: '' },
    { title: '', description: '', image_url: '' }
  ]);
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch(`${API}/api/admin/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPolls(data);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async (pollId: string) => {
    setLoadingVotes(true);
    setShowVotesModal(pollId);
    try {
      const res = await fetch(`${API}/api/admin/polls/${pollId}/votes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVotes(data);
    } catch (err) {
      console.error('Failed to fetch votes:', err);
    } finally {
      setLoadingVotes(false);
    }
  };

  const createPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty options
    const validOptions = options.filter(o => o.title.trim());
    if (validOptions.length < 2) {
      alert('Please add at least 2 options');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API}/api/admin/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          end_date: formData.end_date || null,
          options: validOptions
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', type: 'voting', end_date: '', show_results: true });
        setOptions([{ title: '', description: '', image_url: '' }, { title: '', description: '', image_url: '' }]);
        fetchPolls();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create poll');
      }
    } catch (err) {
      console.error('Failed to create poll:', err);
      alert('Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  const updatePollStatus = async (pollId: string, status: string) => {
    try {
      await fetch(`${API}/api/admin/polls/${pollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchPolls();
    } catch (err) {
      console.error('Failed to update poll:', err);
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? All votes will be lost.')) return;
    
    try {
      await fetch(`${API}/api/admin/polls/${pollId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPolls();
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  const addOption = () => {
    setOptions([...options, { title: '', description: '', image_url: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof NewOption, value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <a href="#admin" className="text-gray-500 hover:text-gray-700">← Back</a>
              <h1 className="text-2xl font-bold text-gray-900">Voting Polls</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Create Poll
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {polls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Vote size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Polls Yet</h3>
            <p className="text-gray-500 mb-6">Create your first voting poll to engage your audience</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Create Poll
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {polls.map(poll => (
              <div key={poll.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{poll.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(poll.status)}`}>
                          {poll.status}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {poll.type}
                        </span>
                      </div>
                      {poll.description && (
                        <p className="text-gray-600 mb-4">{poll.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {poll.total_votes} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 size={16} />
                          {poll.options.length} options
                        </span>
                        {poll.end_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            Ends: {new Date(poll.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchVotes(poll.id)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Votes"
                      >
                        <Eye size={20} />
                      </button>
                      {poll.status === 'active' ? (
                        <button
                          onClick={() => updatePollStatus(poll.id, 'closed')}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Close Poll"
                        >
                          <XCircle size={20} />
                        </button>
                      ) : (
                        <button
                          onClick={() => updatePollStatus(poll.id, 'active')}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate Poll"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => deletePoll(poll.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Poll"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Options with results */}
                  <div className="mt-6 space-y-3">
                    {poll.options.map(option => {
                      const percentage = poll.total_votes > 0 
                        ? Math.round((option.votes_count / poll.total_votes) * 100) 
                        : 0;
                      
                      return (
                        <div key={option.id} className="relative">
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            {option.image_url && (
                              <img 
                                src={option.image_url} 
                                alt={option.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900 truncate">{option.title}</span>
                                <span className="text-sm font-semibold text-gray-700 ml-2">
                                  {option.votes_count} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create New Poll</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={createPoll} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poll Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Who should be the next governor?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this poll is about..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poll Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'voting' | 'nomination' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="voting">Voting Poll</option>
                    <option value="nomination">Nomination Poll</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_results}
                    onChange={e => setFormData({ ...formData, show_results: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show results to voters</span>
                </label>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Options *</label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Option
                  </button>
                </div>
                
                <div className="space-y-4">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 font-bold rounded-full flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={option.title}
                          onChange={e => updateOption(index, 'title', e.target.value)}
                          placeholder="Option title"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="text"
                          value={option.description}
                          onChange={e => updateOption(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="url"
                          value={option.image_url}
                          onChange={e => updateOption(index, 'image_url', e.target.value)}
                          placeholder="Image URL (optional)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Votes Modal */}
      {showVotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Vote Details</h2>
              <button 
                onClick={() => setShowVotesModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {loadingVotes ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : votes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No votes yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone Number</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voted For</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {votes.map(vote => (
                        <tr key={vote.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">
                            {vote.phone_number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{vote.option_title}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(vote.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
