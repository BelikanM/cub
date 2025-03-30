import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiSearch, HiHeart, HiUser } from 'react-icons/hi';
import './NavFooter.css';

const NavFooter = () => {
  const location = useLocation();
  
  // Fonction pour vérifier si le lien est actif
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="nav-footer">
      <div className="nav-container">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <HiHome className="nav-icon" />
          <span className="nav-text">Accueil</span>
        </Link>
        
        <Link to="/recherche" className={`nav-item ${isActive('/recherche') ? 'active' : ''}`}>
          <HiSearch className="nav-icon" />
          <span className="nav-text">Recherche</span>
        </Link>
        
        <Link to="/favoris" className={`nav-item ${isActive('/favoris') ? 'active' : ''}`}>
          <HiHeart className="nav-icon" />
          <span className="nav-text">Favoris</span>
        </Link>
        
        <Link to="/profil" className={`nav-item ${isActive('/profil') ? 'active' : ''}`}>
          <HiUser className="nav-icon" />
          <span className="nav-text">Profil</span>
        </Link>
      </div>
    </nav>
  );
};

export default NavFooter;

