import React, { useState } from 'react';
import { HiHeart, HiOutlineTrash } from 'react-icons/hi';
import './Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([
    { id: 1, title: 'Favori 1', description: 'Description du premier élément en favori', date: '2023-10-15' },
    { id: 2, title: 'Favori 2', description: 'Description du deuxième élément en favori', date: '2023-10-10' },
    { id: 3, title: 'Favori 3', description: 'Description du troisième élément en favori', date: '2023-09-28' }
  ]);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  return (
    <div className="page-container favorites-page">
      <header className="page-header">
        <h1>Mes Favoris</h1>
        <p className="subtitle">{favorites.length} éléments enregistrés</p>
      </header>

      {favorites.length > 0 ? (
        <div className="favorites-list">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="favorite-card">
              <div className="favorite-image placeholder"></div>
              <div className="favorite-content">
                <h3>{favorite.title}</h3>
                <p>{favorite.description}</p>
                <div className="favorite-footer">
                  <span className="favorite-date">Ajouté le {favorite.date}</span>
                  <button 
                    className="remove-button" 
                    onClick={() => removeFavorite(favorite.id)}
                    aria-label="Supprimer des favoris"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <HiHeart size={60} />
          </div>
          <h2>Aucun favori</h2>
          <p>Vous n'avez pas encore ajouté d'éléments à vos favoris.</p>
          <button className="action-button">Découvrir du contenu</button>
        </div>
      )}
    </div>
  );
};

export default Favorites;

