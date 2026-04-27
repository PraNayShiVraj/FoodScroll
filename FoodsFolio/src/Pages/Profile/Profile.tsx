import React, { useState } from 'react';
import { Grid, Clapperboard, Link as LinkIcon } from 'lucide-react';

// Define the shape of our post data
interface FoodPost {
  id: number;
  imageUrl: string;
  type: 'post' | 'reel';
}

const FoodProfile: React.FC = () => {
  // State management for interaction
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');

  // Mock data for the food grid
  const foodContent: FoodPost[] = Array.from({ length: 9 }).map((_, i) => ({
    id: i,
    imageUrl: `https://picsum.photos/seed/${i + 50}/500/500`,
    type: i % 3 === 0 ? 'reel' : 'post',
  }));

  const handleFollowToggle = (): void => {
    setIsFollowing((prev) => !prev);
  };

  return (
    <div className="max-w-4xl mx-auto md:pt-8 bg-white min-h-screen">
      {/* --- Profile Header --- */}
      <header className="flex flex-col md:flex-row items-center md:items-start gap-8 px-4 pb-10 border-b border-gray-200">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-20 h-20 md:w-36 md:h-36 rounded-full p-1 border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&h=300"
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-xl font-light text-gray-800">culinary_chronicles</h1>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all ${isFollowing
                    ? 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="px-4 py-1.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200">
                Message
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start gap-8 text-sm">
            <span><strong>128</strong> posts</span>
            <span><strong>12.4k</strong> followers</span>
            <span><strong>450</strong> following</span>
          </div>

          {/* Bio */}
          <div className="text-sm">
            <h2 className="font-semibold">Pranay's Kitchen</h2>
            <p className="text-gray-600">Computer Scientist by day, Chef by night. 👨‍🍳💻</p>
            <p>Curating the best recipes and street food spots.</p>
            <div className="flex items-center justify-center md:justify-start gap-1 text-blue-900 font-medium mt-1">
              <LinkIcon size={14} />
              <a href="#" className="hover:underline">myportfolio.dev/food</a>
            </div>
          </div>
        </div>
      </header>

      {/* --- Navigation Tabs --- */}
      <div className="flex justify-center border-t border-gray-100 md:border-none">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-4 px-8 text-xs font-semibold tracking-widest uppercase transition-all ${activeTab === 'posts' ? 'border-t border-black text-black -mt-[1px]' : 'text-gray-400'
            }`}
        >
          <Grid size={16} /> Posts
        </button>
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-4 px-8 text-xs font-semibold tracking-widest uppercase transition-all ${activeTab === 'reels' ? 'border-t border-black text-black -mt-[1px]' : 'text-gray-400'
            }`}
        >
          <Clapperboard size={16} /> Reels
        </button>
      </div>

      {/* --- Content Grid --- */}
      <div className="grid grid-cols-3 gap-1 md:gap-8 pb-10">
        {foodContent
          .filter(item => activeTab === 'posts' ? item.type === 'post' : item.type === 'reel')
          .map((item) => (
            <div
              key={item.id}
              className={`relative group cursor-pointer overflow-hidden bg-gray-100 ${activeTab === 'reels' ? 'aspect-[9/16]' : 'aspect-square'
                }`}
            >
              <img
                src={item.imageUrl}
                alt="Food content"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold">
                {activeTab === 'reels' ? <Clapperboard /> : 'View Post'}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default FoodProfile;