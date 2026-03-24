import { useState, useEffect } from 'react';
import { Vote, CheckCircle, Phone, AlertCircle, Share2, Facebook, Twitter, Link2, Check, ArrowLeft, Calendar, Users, MessageCircle } from 'lucide-react';

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
    } catch (err) {
      console.error('Failed to fetch poll:', err);
    } finally {
      setLoading(false);
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

  const getShareUrl = () => {
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
      <div className="min-h-screen bg-white flex items-center justify-center pt-[200px] lg:pt-[220px]">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006633] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-white pt-[200px] lg:pt-[220px]">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-20 text-center">
          <Vote size={56} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-3">Poll Not Found</h1>
          <p className="text-gray-600 text-lg mb-8">This poll may have been removed or doesn't exist.</p>
          <a href="#polls" className="inline-flex items-center gap-2 px-8 py-3 bg-[#006633] text-white font-semibold rounded-full hover:bg-[#004d24] transition-colors">
            <ArrowLeft size={18} />
            Back to Polls
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-[400px] lg:h-[500px] pt-[200px] lg:pt-[220px] bg-gradient-to-br from-[#006633] to-[#00994d]">
        {/* Decorative Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 text-center z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-full">
              <Vote size={32} className="text-white" />
            </div>
            <span className="px-4 py-2 bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-sm">
              {poll.type === 'nomination' ? 'Nomination' : 'Poll'}
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight max-w-4xl drop-shadow-lg">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="font-sans text-lg sm:text-xl text-white/90 max-w-2xl leading-relaxed drop-shadow">
              {poll.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-16">
        
        {/* Poll Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12 pb-8 border-b border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={18} className="text-[#006633]" />
              <span className="text-2xl font-bold text-gray-900">{poll.total_votes.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600">Total Votes</p>
          </div>
          {poll.end_date && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar size={18} className="text-[#006633]" />
                <span className="text-lg font-semibold text-gray-900">{formatDate(poll.end_date).split(' ')[0]}</span>
              </div>
              <p className="text-sm text-gray-600">Ends</p>
            </div>
          )}
          <div className="text-center col-span-2 sm:col-span-1">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
              poll.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${poll.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}></span>
              {poll.status === 'active' ? 'Active' : 'Closed'}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl mb-8">
            <CheckCircle size={20} className="flex-shrink-0" />
            <span className="font-medium">Thank you! Your vote has been recorded.</span>
          </div>
        )}

        {/* Voting Options */}
        <div className="space-y-4 mb-8">
          {poll.options.map((option) => {
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
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                  isSelected 
                    ? 'border-[#006633] bg-[#006633]/5' 
                    : isVotedOption
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-gray-200 hover:border-[#006633]/30 hover:bg-gray-50'
                } ${(hasVoted || poll.status !== 'active') ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-4">
                  {option.image_url && (
                    <img 
                      src={option.image_url} 
                      alt={option.title}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className={`text-lg font-serif font-bold ${isVotedOption ? 'text-green-700' : 'text-gray-900'}`}>
                        {option.title}
                        {isVotedOption && (
                          <CheckCircle size={18} className="inline ml-2 text-green-600" />
                        )}
                      </span>
                      {(hasVoted || poll.show_results) && (
                        <span className="text-xl font-bold text-[#006633] flex-shrink-0">{percentage}%</span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                    )}
                    {(hasVoted || poll.show_results) && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-700 ${
                              isVotedOption ? 'bg-green-500' : 'bg-[#006633]'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-500">{option.votes_count.toLocaleString()} votes</p>
                      </>
                    )}
                  </div>
                  {!hasVoted && poll.status === 'active' && (
                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-[#006633] bg-[#006633]' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={16} className="text-white" />}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Phone Input */}
        {showPhoneInput && !hasVoted && poll.status === 'active' && (
          <div className="p-6 bg-[#006633]/5 border border-[#006633]/20 rounded-2xl mb-8 backdrop-blur-sm">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <Phone size={16} className="inline mr-2 text-[#006633]" />
              Verify with your phone number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(formatPhoneNumber(e.target.value))}
              placeholder="0712345678"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006633] text-base"
            />
            <p className="text-xs text-gray-500 mt-2">
              ✓ Your phone is verified. One vote per number ensures fair polling.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl mb-8">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Vote Button */}
        {!hasVoted && poll.status === 'active' && (
          <button
            onClick={handleVote}
            disabled={!selectedOption || voting}
            className="w-full px-8 py-4 bg-[#006633] text-white font-semibold text-lg rounded-2xl hover:bg-[#004d24] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Vote size={20} />
            {voting ? 'Submitting...' : showPhoneInput ? 'Submit My Vote' : 'Vote Now'}
          </button>
        )}

        {poll.status !== 'active' && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">This poll is no longer accepting votes</p>
          </div>
        )}

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Share2 size={20} className="text-[#006633]" />
            Share This Poll
          </h2>
          <div className="space-y-4">
            {/* Share Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={shareOnFacebook} 
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:shadow-lg transition-all border border-gray-200" 
                title="Share on Facebook"
              >
                <Facebook size={20} />
              </button>
              <button 
                onClick={shareOnTwitter} 
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-900 hover:bg-gray-50 hover:shadow-lg transition-all border border-gray-200" 
                title="Share on X/Twitter"
              >
                <Twitter size={20} />
              </button>
              <button 
                onClick={shareOnWhatsApp} 
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-green-600 hover:bg-green-50 hover:shadow-lg transition-all border border-gray-200" 
                title="Share on WhatsApp"
              >
                <MessageCircle size={20} />
              </button>
              <button 
                onClick={copyLink}
                className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all border ${
                  linkCopied 
                    ? 'bg-green-100 text-green-600 border-green-300' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:shadow-lg'
                }`}
                title={linkCopied ? 'Copied!' : 'Copy link'}
              >
                {linkCopied ? <Check size={20} /> : <Link2 size={20} />}
              </button>
            </div>
            {/* Share Link */}
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={`www.mtkenyanews.com/#poll/${pollId}`}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Back to Polls */}
        <div className="mt-12 text-center">
          <a href="#polls" className="inline-flex items-center gap-2 px-6 py-3 text-[#006633] font-semibold hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={18} />
            Back to All Polls
          </a>
        </div>
      </div>
    </div>
  );
}
