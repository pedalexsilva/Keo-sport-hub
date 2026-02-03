import React, { useState } from 'react';
import { Camera, Heart, MessageCircle, MoreHorizontal, TrendingUp, Trophy } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useOfficeLeaderboard } from '../hooks/useOfficeLeaderboard';
import { useSocialFeed, useToggleLike } from '../hooks/useSocial';
import { User } from '../types';

interface SocialViewProps {
    currentUser?: User;
}

const SocialView: React.FC<SocialViewProps> = ({ currentUser }) => {
    const [subTab, setSubTab] = useState<'feed' | 'ranking'>('ranking');
    const { data: postsData, isLoading: isLoadingPosts } = useSocialFeed(currentUser?.id);
    const toggleLikeMutation = useToggleLike();
    const { data: leaderboardData, isLoading } = useLeaderboard();

    const toggleLike = (postId: string, isLiked: boolean) => {
        if (!currentUser) return;
        toggleLikeMutation.mutate({ postId, isLiked, userId: currentUser.id });
    };

    const { data: officeData, isLoading: isLoadingOffice } = useOfficeLeaderboard();
    const topOffice = officeData?.[0]; // Get first place
    const secondOfficePoints = officeData?.[1]?.total_points || 0;
    const pointsDifference = topOffice ? topOffice.total_points - secondOfficePoints : 0;

    return (
        <div className="px-6 pb-24 pt-6 animate-fade-in bg-gray-50 min-h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#002D72]">Community</h2>
                <button className="bg-[#009CDE] p-2 rounded-full text-white shadow-lg hover:bg-blue-600 transition cursor-pointer">
                    <Camera className="w-5 h-5" />
                </button>
            </div>
            <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                <button onClick={() => setSubTab('ranking')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${subTab === 'ranking' ? 'bg-white text-[#002D72] shadow-sm' : 'text-gray-500'}`}>Ranking</button>
                <button onClick={() => setSubTab('feed')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${subTab === 'feed' ? 'bg-white text-[#002D72] shadow-sm' : 'text-gray-500'}`}>Moments</button>
            </div>

            {subTab === 'feed' ? (
                <div className="space-y-6">
                    {isLoadingPosts ? (
                        <div className="text-center py-8 text-gray-400">Loading feed...</div>
                    ) : postsData?.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No posts yet. Be the first!</div>
                    ) : (
                        postsData?.map(post => (
                            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <img src={post.user.avatar} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-100 object-cover" />
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{post.user.name}</p>
                                            <p className="text-xs text-gray-400">{post.created_at}</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400"><MoreHorizontal className="w-5 h-5" /></button>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                                {post.image_url && (<div className="rounded-xl overflow-hidden mb-3"><img src={post.image_url} className="w-full h-48 object-cover" /></div>)}
                                <div className="flex items-center gap-4 pt-2">
                                    <button onClick={() => toggleLike(post.id, post.has_liked)} className={`flex items-center gap-1 text-sm font-medium transition cursor-pointer ${post.has_liked ? 'text-red-500' : 'text-gray-500'}`}>
                                        <Heart className={`w-5 h-5 ${post.has_liked ? 'fill-current' : ''}`} />
                                        {post.likes_count}
                                    </button>
                                    <button className="flex items-center gap-1 text-sm font-medium text-gray-500 cursor-pointer"><MessageCircle className="w-5 h-5" />{post.comments_count}</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-[#002D72] rounded-2xl p-4 text-white mb-4">
                        <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-[#009CDE]" /><span className="text-xs font-bold uppercase tracking-wider">Top Office</span></div>
                        {isLoadingOffice ? (
                            <div className="text-center py-4 text-blue-200 text-sm">Loading top office...</div>
                        ) : topOffice ? (
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-2xl font-bold">{topOffice.office}</span>
                                    {pointsDifference > 0 && <p className="text-xs text-blue-200">Leading by {pointsDifference} pts</p>}
                                </div>
                                <Trophy className="w-8 h-8 text-yellow-400" />
                            </div>
                        ) : (
                            <div className="flex justify-between items-end"><div><span className="text-2xl font-bold">No data</span></div><Trophy className="w-8 h-8 text-gray-400" /></div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="text-center py-4 text-gray-400">Loading ranking...</div>
                    ) : (
                        leaderboardData?.map((person, index) => {
                            const isMe = currentUser && person.user_id === currentUser.id;
                            return (
                                <div key={person.user_id} className={`flex items-center p-4 rounded-2xl transition-all duration-500 ${isMe ? 'bg-white border-2 border-[#009CDE] shadow-md' : 'bg-white border border-gray-100'}`}>
                                    <div className={`font-bold text-lg w-8 ${isMe ? 'text-[#002D72]' : 'text-gray-400'}`}>{person.rank}</div>
                                    <img src={person.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.full_name || 'User')}`} alt={person.full_name || 'User'} className="w-10 h-10 rounded-full border-2 border-white/20 mr-4 bg-gray-200 object-cover" />
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm text-gray-900`}>{person.full_name} {isMe && '(You)'}</h4>
                                        <p className="text-xs text-gray-400">
                                            {person.office ? `${person.office} • ` : ''} KEO Member
                                        </p>
                                    </div>
                                    <div className="text-right"><p className="font-bold text-[#002D72]">{person.total_points}</p><p className="text-[10px] text-gray-400">pts</p></div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default SocialView;
