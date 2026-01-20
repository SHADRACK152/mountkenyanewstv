import { useState, useEffect } from 'react';
import { Vote, Users, Calendar, ArrowRight, TrendingUp } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface PollOption {
  id: string;
  title: string;
  votes_count: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  end_date?: string;
  options: PollOption[];
  total_votes: number;
  created_at: string;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch(`${API}/api/polls?status=active&include_options=true`);
      const data = await res.json();
      setPolls(data);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  return (
    <div className="min-h-screen bg-gray-100 pt-[200px] lg:pt-[220px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Vote size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black">Voting Polls</h1>
              <p className="text-blue-100 mt-1">Have your say on the issues that matter</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {polls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Vote size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Polls</h3>
            <p className="text-gray-500">Check back soon for new voting polls!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map(poll => {
              // Get leading option
              const leadingOption = poll.options.reduce((max, opt) => 
                opt.votes_count > max.votes_count ? opt : max, 
                poll.options[0]
              );
              const leadingPercentage = poll.total_votes > 0 
                ? Math.round((leadingOption.votes_count / poll.total_votes) * 100) 
                : 0;

              return (
                <a
                  key={poll.id}
                  href={`#poll/${poll.id}`}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Poll Type Badge */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between">
                    <span className="text-white text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Vote size={16} />
                      {poll.type === 'nomination' ? 'Nomination' : 'Vote Now'}
                    </span>
                    {poll.end_date && (
                      <span className="text-blue-100 text-xs flex items-center gap-1">
                        <Calendar size={12} />
                        Ends {formatDate(poll.end_date)}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{poll.description}</p>
                    )}

                    {/* Leading option preview */}
                    {poll.total_votes > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Leading:</span>
                          <span className="font-bold text-blue-600">{leadingPercentage}%</span>
                        </div>
                        <p className="text-gray-900 font-medium text-sm truncate">{leadingOption.title}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${leadingPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {poll.total_votes.toLocaleString()} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp size={14} />
                          {poll.options.length} options
                        </span>
                      </div>
                      <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Vote <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
