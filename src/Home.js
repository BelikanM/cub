import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="page-container home-page">
      <header className="page-header">
        <h1>Bienvenue</h1>
        <p className="subtitle">Découvrez notre application</p>
      </header>
      
      <section className="featured-section">
        <h2>Suggestions pour vous</h2>
        <div className="cards-container">
          {[1, 2, 3].map((item) => (
            <div key={item} className="card">
              <div className="card-image placeholder"></div>
              <div className="card-content">
                <h3>Élément populaire {item}</h3>
                <p>Description courte de cet élément spécial</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="categories-section">
        <h2>Catégories</h2>
        <div className="categories-grid">
          {['Catégorie 1', 'Catégorie 2', 'Catégorie 3', 'Catégorie 4'].map((category, index) => (
            <div key={index} className="category-item">
              <div className="category-icon placeholder"></div>
              <span>{category}</span>
            </div>
          ))}
        </div>
      </section>
      
      <section className="recent-section">
        <h2>Récemment consultés</h2>
        <div className="horizontal-scroll">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="scroll-item">
              <div className="item-image placeholder"></div>
              <p>Item {item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

