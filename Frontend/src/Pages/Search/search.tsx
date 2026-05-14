import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, User, ChevronDown } from 'lucide-react';
import { API_URL as apiUrl } from '../../config/api';
import './search.css';

interface UserResult {
  _id: string;
  name: string;
  username: string;
  profilePic: string;
  bio: string;
}

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState<'ingredients' | 'accounts' | 'dishes'>('ingredients');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = useCallback(async (q: string, type: 'ingredients' | 'accounts' | 'dishes') => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    if (type === 'ingredients' || type === 'dishes') {
      // Ingredients and Dishes search not yet fully implemented on backend
      setResults([]);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.users || []);
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    }
    setIsLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (searchType === 'accounts' || searchType === 'dishes') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchResults(val, searchType), 350);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchType === 'ingredients' && e.key === 'Enter') {
      e.preventDefault();
      const val = query.trim().toLowerCase();
      if (val && !ingredients.includes(val)) {
        setIngredients([...ingredients, val]);
      }
      setQuery('');
    }
  };

  const removeIngredient = (ingToRemove: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingToRemove));
  };

  const clearSearch = () => {
    setQuery('');
    if (searchType === 'accounts') {
      setResults([]);
      setHasSearched(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-container">

        {/* Header */}
        <div className="search-header">
          <h1 className="search-title">Discover</h1>
          <p className="search-subtitle">Find food creators and friends</p>
        </div>

        {/* Search Input */}
        <div className="search-input-wrapper">
          <div className="custom-dropdown-container" ref={dropdownRef}>
            <button 
              className={`custom-dropdown-header ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
            >
              <span className="selected-type">
                {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
              </span>
              <ChevronDown size={18} className={`chevron-icon ${isDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="custom-dropdown-list">
                {[
                  { value: 'ingredients', label: 'Ingredients' },
                  { value: 'dishes', label: 'Dishes' },
                  { value: 'accounts', label: 'Accounts' }
                ].map((option) => (
                  <div
                    key={option.value}
                    className={`custom-dropdown-item ${searchType === option.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSearchType(option.value as any);
                      setQuery('');
                      setResults([]);
                      setHasSearched(false);
                      setIngredients([]);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="search-main-area">
            <div className="search-input-container">
              <SearchIcon className="search-icon-left" size={20} />
              <input
                id="search-input"
                type="text"
                className="search-input"
                placeholder={
                  searchType === 'accounts' 
                    ? "Search by username or name…" 
                    : searchType === 'dishes'
                    ? "Search for dishes…"
                    : "Type ingredient and press Enter…"
                }
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button className="search-clear-btn" onClick={clearSearch} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Ingredients Tags Area */}
            {searchType === 'ingredients' && ingredients.length > 0 && (
              <div className="ingredients-tags-container">
                {ingredients.map(ing => (
                  <div key={ing} className="ingredient-tag">
                    {ing}
                    <button 
                      className="ingredient-tag-remove" 
                      onClick={() => removeIngredient(ing)}
                      aria-label={`Remove ${ing}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="search-results-area">

          {/* Loading shimmer */}
          {isLoading && (
            <div className="search-results-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="search-result-card skeleton-card">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-text-block">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-long" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!isLoading && hasSearched && results.length > 0 && (
            <div className="search-results-list">
              {results.map((user) => (
                <div
                  key={user._id}
                  className="search-result-card"
                  onClick={() => navigate(`/profile/${user._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/profile/${user._id}`)}
                >
                  <div className="result-avatar-wrapper">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.username}
                        className="result-avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="result-avatar-placeholder">
                        <User size={24} color="#737373" />
                      </div>
                    )}
                  </div>
                  <div className="result-info">
                    <span className="result-username">@{user.username}</span>
                    <span className="result-name">{user.name}</span>
                    {user.bio && <p className="result-bio">{user.bio}</p>}
                  </div>
                  <div className="result-arrow">›</div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="search-empty-state">
              <div className="empty-icon">🔍</div>
              <p className="empty-title">
                {searchType === 'accounts' ? 'No users found' : searchType === 'dishes' ? 'No dishes found' : 'No ingredients found'}
              </p>
              <p className="empty-subtitle">
                {searchType === 'accounts' 
                  ? 'Try a different name or username' 
                  : searchType === 'dishes'
                  ? 'Dish search is coming soon!'
                  : 'Ingredient search is coming soon!'}
              </p>
            </div>
          )}

          {/* Initial state — not yet searched */}
          {!isLoading && !hasSearched && (
            <div className="search-empty-state search-initial">
              <div className="empty-icon">🍽️</div>
              <p className="empty-title">
                {searchType === 'accounts' 
                  ? 'Search for creators' 
                  : searchType === 'dishes'
                  ? 'Search for dishes'
                  : 'Search for ingredients'}
              </p>
              <p className="empty-subtitle">
                {searchType === 'accounts' 
                  ? 'Discover food lovers by their username or name' 
                  : searchType === 'dishes'
                  ? 'Find delicious recipes by name'
                  : 'Find recipes by their ingredients'}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Search;
