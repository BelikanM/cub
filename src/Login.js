import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Utiliser userId au lieu de ID
        const userId = data.userId; // Assurez-vous que votre API renvoie userId
        
        // Stockez les informations de l'utilisateur dans localStorage ou sessionStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirection vers la page d'accueil après connexion
        navigate('/');
      } else {
        setError(data.message || 'Échec de la connexion');
      }
    } catch (err) {
      setError('Erreur de serveur. Veuillez réessayer plus tard.');
      console.error('Erreur de connexion:', err);
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Se connecter</button>
      </form>
      <p className="register-link">
        Pas encore de compte? <a href="/register">S'inscrire</a>
      </p>
    </div>
  );
}

export default Login;

