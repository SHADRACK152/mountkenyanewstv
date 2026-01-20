import { useState, useEffect } from 'react';
import { Vote, CheckCircle, Phone, AlertCircle, TrendingUp, Share2, Facebook, Twitter, Link2, Check, ArrowLeft, Calendar, Users } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface PollOption {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  votes_count: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  show_results: boolean;
  end_date?: string;
  options: PollOption[];
  total_votes: number;
  created_at: string;
}

interface PollPageProps {
  pollId: string;
}

export default function PollPage({ pollId }: PollPageProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const res = await fetch(`${API}/api/polls/${pollId}`);
      if (!res.ok) {
        throw new Error('Poll not found');
      }
      const data = await res.json();
      setPoll(data);

      // Check if user has voted (from localStorage)
      const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
      if (votedPolls[pollId]) {
        setHasVoted(true);
        setVotedOptionId(votedPolls[pollId].optionId);
      }

      // Get or create short link for this poll
      fetchShortUrl(pollId);
    } catch (err) {
      console.error('Failed to fetch poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortUrl = async (id: string) => {
    try {
      const checkRes = await fetch(`${API}/api/poll-links?poll_id=${id}`);
      const checkData = await checkRes.json();
      
      if (checkData.exists) {
        setShortUrl(checkData.short_url);
      } else {
        const createRes = await fetch(`${API}/api/poll-links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poll_id: id }),
        });
        const createData = await createRes.json();
        if (createData.short_url) {
          setShortUrl(createData.short_url);
        }
      }
    } catch (err) {
      console.error('Failed to get short URL:', err);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('254')) {
      return '+' + digits.slice(0, 12);
    } else if (digits.startsWith('0')) {
      return digits.slice(0, 10);
    } else if (digits.startsWith('7') || digits.startsWith('1')) {
      return '0' + digits.slice(0, 9);
    }
    return digits.slice(0, 10);
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return (digits.length === 10 && (digits.startsWith('07') || digits.startsWith('01'))) ||
           (digits.length === 12 && digits.startsWith('254'));
  };

  const handleVote = async () => {
    if (!poll || !selectedOption) return;
    
    if (!showPhoneInput) {
      setShowPhoneInput(true);
      return;
    }
    
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }
    
    setVoting(true);
    setError('');
    
    try {
      const res = await fetch(`${API}/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          option_id: selectedOption,
          phone_number: phoneNumber
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to vote');
        return;
      }
      
      // Save to localStorage
      const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
      votedPolls[poll.id] = { optionId: selectedOption, phone: phoneNumber };
      localStorage.setItem('voted_polls', JSON.stringify(votedPolls));
      
      setPoll({
        ...poll,
        options: data.options,
        total_votes: data.total_votes
      });
      
      setHasVoted(true);
      setVotedOptionId(selectedOption);
      setSuccess(true);
      setShowPhoneInput(false);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  // Always prefer short URL for sharing (it has OG tags for previews)
  const getShareUrl = () => {
    // If short URL is available, use it (better for social media previews)
    if (shortUrl) return shortUrl;
    // Fallback to direct URL (won't show previews on social media)
    return `https://www.mtkenyanews.com/#poll/${pollId}`;
  };

  const shareOnFacebook = () => {
    const url = getShareUrl();
    // Use Facebook's dialog/share which properly shows OG tags from short link
    const shareUrl = `https://www.facebook.com/dialog/share?app_id=966242223397117&href=${encodeURIComponent(url)}&display=popup&redirect_uri=${encodeURIComponent('https://www.mtkenyanews.com/')}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  const shareOnTwitter = () => {
    const url = getShareUrl();
    const text = `🗳️ Vote now: ${poll?.title || ''}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&via=mtkenyanews`, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const url = getShareUrl();
    const text = `🗳️ *${poll?.title || ''}*\n\n${poll?.description || 'Cast your vote now!'}\n\n👉 Vote here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-[200px] lg:pt-[220px]">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-100 pt-[200px] lg:pt-[220px]">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Vote size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Poll Not Found</h1>
          <p className="text-gray-500 mb-6">This poll may have been removed or doesn't exist.</p>
          <a href="#polls" className="text-blue-600 font-semibold hover:underline">
            ← View All Polls
          </a>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-[200px] lg:pt-[220px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <a href="#polls" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={18} />
            Back to Polls
          </a>
          <div className="flex items-center gap-3 text-white">
            <Vote size={28} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {poll.type === 'nomination' ? 'Nomination Poll' : 'Voting Poll'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Poll Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="text-lg text-gray-600 mb-6">{poll.description}</p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              <span className="flex items-center gap-1">
                <Users size={16} />
                {poll.total_votes.toLocaleString()} votes
              </span>
              {poll.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Ends {formatDate(poll.end_date)}
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                poll.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {poll.status === 'active' ? 'Active' : 'Closed'}
              </span>
            </div>

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl mb-6">
                <CheckCircle size={20} />
                <span className="font-medium">Thank you! Your vote has been recorded.</span>
              </div>
            )}

            {/* Voting Options */}
            <div className="space-y-4 mb-6">
              {poll.options.map(option => {
                const percentage = poll.total_votes > 0 
                  ? Math.round((option.votes_count / poll.total_votes) * 100) 
                  : 0;
                const isSelected = selectedOption === option.id;
                const isVotedOption = votedOptionId === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => !hasVoted && poll.status === 'active' && setSelectedOption(option.id)}
                    disabled={hasVoted || poll.status !== 'active'}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isVotedOption
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${(hasVoted || poll.status !== 'active') ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-4">
                      {option.image_url && (
                        <img 
                          src={option.image_url} 
                          alt={option.title}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-lg font-semibold ${isVotedOption ? 'text-green-700' : 'text-gray-900'}`}>
                            {option.title}
                            {isVotedOption && (
                              <CheckCircle size={18} className="inline ml-2 text-green-600" />
                            )}
                          </span>
                          {(hasVoted || poll.show_results) && (
                            <span className="text-lg font-bold text-gray-700">{percentage}%</span>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-gray-500 mb-3">{option.description}</p>
                        )}
                        {(hasVoted || poll.show_results) && (
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-700 ${
                                isVotedOption ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                        {(hasVoted || poll.show_results) && (
                          <p className="text-sm text-gray-500 mt-2">{option.votes_count.toLocaleString()} votes</p>
                        )}
                      </div>
                      {!hasVoted && poll.status === 'active' && (
                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Phone Input */}
            {showPhoneInput && !hasVoted && poll.status === 'active' && (
              <div className="p-5 bg-blue-50 rounded-xl mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Phone size={16} className="inline mr-2" />
                  Enter your phone number to verify your vote
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  placeholder="0712345678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your phone number ensures one vote per person and will be kept private.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl mb-6">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Vote button */}
            {!hasVoted && poll.status === 'active' && (
              <button
                onClick={handleVote}
                disabled={!selectedOption || voting}
                className="w-full px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {voting ? 'Submitting...' : showPhoneInput ? 'Submit My Vote' : 'Vote Now'}
              </button>
            )}

            {poll.status !== 'active' && (
              <div className="text-center py-4 text-gray-500">
                This poll is no longer accepting votes.
              </div>
            )}

            {/* Total votes */}
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100 text-gray-500">
              <TrendingUp size={18} />
              <span className="font-medium">{poll.total_votes.toLocaleString()} total votes</span>
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-gray-50 px-6 sm:px-8 py-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Share2 size={16} />
              Share this poll
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={shareOnFacebook} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors" title="Share on Facebook">
                <Facebook size={20} />
              </button>
              <button onClick={shareOnTwitter} className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors" title="Share on X/Twitter">
                <Twitter size={20} />
              </button>
              <button onClick={shareOnWhatsApp} className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors" title="Share on WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button 
                onClick={copyLink}
                className={`p-3 rounded-xl transition-colors ${linkCopied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                title={linkCopied ? 'Copied!' : 'Copy link'}
              >
                {linkCopied ? <Check size={20} /> : <Link2 size={20} />}
              </button>
              <div className="flex-1 min-w-[200px]">
                <input 
                  type="text" 
                  readOnly 
                  value={shortUrl || `www.mtkenyanews.com/#poll/${pollId}`}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Back to polls */}
        <div className="mt-8 text-center">
          <a href="#polls" className="text-blue-600 font-semibold hover:underline">
            ← View All Polls
          </a>
        </div>
      </div>
    </div>
  );
}
