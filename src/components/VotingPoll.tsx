import { useState, useEffect } from 'react';
import { Vote, CheckCircle, Phone, X, AlertCircle, TrendingUp } from 'lucide-react';

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
  options: PollOption[];
  total_votes: number;
}

interface VotingPollProps {
  pollId?: string; // If provided, show specific poll
  className?: string;
}

export default function VotingPoll({ pollId, className = '' }: VotingPollProps) {
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

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      let url = `${API}/api/polls`;
      if (pollId) {
        url = `${API}/api/polls/${pollId}`;
      } else {
        url += '?status=active&include_options=true';
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (pollId) {
        setPoll(data);
      } else {
        // Get the first active poll
        if (Array.isArray(data) && data.length > 0) {
          setPoll(data[0]);
        }
      }
      
      // Check if user has voted (from localStorage)
      if (data?.id || data[0]?.id) {
        const activePollId = pollId || data[0]?.id;
        const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
        if (votedPolls[activePollId]) {
          setHasVoted(true);
          setVotedOptionId(votedPolls[activePollId].optionId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format for Kenyan numbers
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
    // Kenyan phone: 07XX, 01XX (10 digits) or +254 (12 digits)
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
      
      // Update poll with new results
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

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null; // No active poll
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-2 text-white">
          <Vote size={20} />
          <span className="text-sm font-semibold uppercase tracking-wider">
            {poll.type === 'nomination' ? 'Nomination Poll' : 'Vote Now'}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{poll.title}</h3>
        {poll.description && (
          <p className="text-gray-600 text-sm mb-4">{poll.description}</p>
        )}
        
        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg mb-4">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Thank you! Your vote has been recorded.</span>
          </div>
        )}
        
        {/* Options */}
        <div className="space-y-3">
          {poll.options.map(option => {
            const percentage = poll.total_votes > 0 
              ? Math.round((option.votes_count / poll.total_votes) * 100) 
              : 0;
            const isSelected = selectedOption === option.id;
            const isVotedOption = votedOptionId === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
                disabled={hasVoted}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : isVotedOption
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  {option.image_url && (
                    <img 
                      src={option.image_url} 
                      alt={option.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${isVotedOption ? 'text-green-700' : 'text-gray-900'}`}>
                        {option.title}
                        {isVotedOption && (
                          <CheckCircle size={16} className="inline ml-2 text-green-600" />
                        )}
                      </span>
                      {(hasVoted || poll.show_results) && (
                        <span className="text-sm font-bold text-gray-700">{percentage}%</span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-500 mb-2">{option.description}</p>
                    )}
                    {(hasVoted || poll.show_results) && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ${
                            isVotedOption ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {!hasVoted && (
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Phone Input */}
        {showPhoneInput && !hasVoted && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={14} className="inline mr-1" />
              Enter your phone number to vote
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="0712345678"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowPhoneInput(false)}
                className="p-3 text-gray-500 hover:bg-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your phone number ensures one vote per person. It will be kept private.
            </p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mt-4">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {/* Vote button */}
        {!hasVoted && (
          <button
            onClick={handleVote}
            disabled={!selectedOption || voting}
            className="w-full mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {voting ? 'Submitting...' : showPhoneInput ? 'Submit Vote' : 'Vote'}
          </button>
        )}
        
        {/* Total votes */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
          <TrendingUp size={16} />
          <span>{poll.total_votes.toLocaleString()} total votes</span>
        </div>
      </div>
    </div>
  );
}
