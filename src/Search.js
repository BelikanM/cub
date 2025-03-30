import React, { useState } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';
import './Search.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([
    'Design moderne', 'React hooks', 'Navigation'
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Simulation des résultats de recherche
      const mockResults = [
        { id: 1, title: 'Résultat 1 pour "' + searchQuery + '"', description: 'Description du premier résultat de recherche.' },
        { id: 2, title: 'Résultat 2 pour "' + searchQuery + '"', description: 'Description du deuxième résultat de recherche.' },
        { id: 3, title: 'Résultat 3 pour "' + searchQuery + '"', description: 'Description du troisième résultat de recherche.' },
      ];
      setSearchResults(mockResults);
      
      // Ajouter à l'historique de recherche
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="page-container search-page">
      <header className="page-header">
        <h1>Recherche</h1>
      </header>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-container">
          <HiSearch className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Que recherchez-vous ?"
            className="search-input"
          />
          {searchQuery && (
            <button type="button" className="clear-button" onClick={clearSearch}>
              <HiX />
            </button>
          )}
        </div>
        <button type="submit" className="search-button">Rechercher</button>
      </form>

      {searchResults.length > 0 ? (
        <div className="search-results">
          <h2>Résultats</h2>
          {searchResults.map((result) => (
            <div key={result.id} className="result-card">
              <h3>{result.title}</h3>
              <p>{result.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="recent-searches">
          <h2>Recherches récentes</h2>
          <ul className="searches-list">
            {recentSearches.map((search, index) => (
              <li key={index} className="search-item">
                <div className="search-history-item" onClick={() => setSearchQuery(search)}>
                  <HiSearch className="history-icon" />
                  <span>{search}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Search;

