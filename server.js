require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialisation d'Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuration de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration de la connexion MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'my_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Accès non autorisé' });
    }

    // Vérifier le token avec Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(403).json({ error: 'Token invalide' });
    }

    req.user = data.user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'authentification' });
  }
};

// Routes API
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM documents WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ? AND user_id = ?', [documentId, userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO documents (title, content, user_id, created_at) VALUES (?, ?, ?, NOW())',
      [title, content, userId]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      title,
      content,
      user_id: userId
    });
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const { title, content } = req.body;
    
    // Vérifier si le document existe et appartient à l'utilisateur
    const [document] = await pool.query(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    );
    
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé ou accès non autorisé' });
    }
    
    await pool.query(
      'UPDATE documents SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [title, content, documentId]
    );
    
    res.json({ id: documentId, title, content, user_id: userId });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    
    // Vérifier si le document existe et appartient à l'utilisateur
    const [document] = await pool.query(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    );
    
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé ou accès non autorisé' });
    }
    
    await pool.query('DELETE FROM documents WHERE id = ?', [documentId]);
    res.status(204).end();
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
  console.log(`API accessible à http://localhost:${PORT}/api`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

