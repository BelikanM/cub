import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import des composants de page
import Home from './Home';
import Profile from './Profile';
import Favorites from './Favorites';
import Search from './Search';
import Login from './Login';
import NavFooter from './NavFooter';

function App() {
  return (
    <Router>
      <div className="App">
        <NavFooter />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/favoris" element={<Favorites />} />
            <Route path="/recherche" element={<Search />} />
            <Route path="/login" element={<Login />} />
            {/* Route par défaut en cas de page non trouvée */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


