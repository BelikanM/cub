import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios'; // Ajouté pour les appels API à notre backend MySQL

// Utilisation des variables d'environnement pour les clés Supabase (gardé pour l'authentification)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// URL de notre API backend qui communique avec MySQL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Les icônes restent identiques
const icons = {
  document: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="#5C6BC0"/>
  </svg>,
  image: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#43A047"/>
  </svg>,
  video: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="#E53935"/>
  </svg>,
  audio: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12ZM10 19C8.9 19 8 18.1 8 17C8 15.9 8.9 15 10 15C11.1 15 12 15.9 12 17C12 18.1 11.1 19 10 19Z" fill="#FB8C00"/>
  </svg>,
  upload: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 20H19V18H5V20ZM5 10H9V16H15V10H19L12 3L5 10Z" fill="#1976D2"/>
  </svg>,
  follow: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 12C17.21 12 19 10.21 19 8C19 5.79 17.21 4 15 4C12.79 4 11 5.79 11 8C11 10.21 12.79 12 15 12ZM15 6C16.1 6 17 6.9 17 8C17 9.1 16.1 10 15 10C13.9 10 13 9.1 13 8C13 6.9 13.9 6 15 6ZM15 14C12.33 14 7 15.34 7 18V20H23V18C23 15.34 17.67 14 15 14ZM9 18C9.22 17.28 12.31 16 15 16C17.7 16 20.8 17.29 21 18H9ZM6 15V12H8V10H6V7H4V10H1V12H4V15H6Z" fill="#4CAF50"/>
  </svg>,
  unfollow: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 12C17.21 12 19 10.21 19 8C19 5.79 17.21 4 15 4C12.79 4 11 5.79 11 8C11 10.21 12.79 12 15 12ZM15 14C12.33 14 7 15.34 7 18V20H23V18C23 15.34 17.67 14 15 14ZM1 10V12H8V10H1Z" fill="#F44336"/>
  </svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#757575"/>
  </svg>
};

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'upload', 'users'
  const fileInputRef = useRef(null);

  // Fonction pour gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Vérifier l'utilisateur au chargement ou après redirection
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Synchroniser l'utilisateur avec la base MySQL
        syncUserWithMySQL(user);
        fetchFiles();
        fetchFollowedUsers();
      }
    }
    getUser();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Synchroniser l'utilisateur avec la base MySQL
          await syncUserWithMySQL(session.user);
          fetchFiles();
          fetchFollowedUsers();
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUploadedFiles([]);
          setFollowedUsers([]);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Synchroniser l'utilisateur Supabase avec MySQL
  const syncUserWithMySQL = async (user) => {
    try {
      await axios.post(`${API_URL}/users/sync`, {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Utilisateur',
        avatar_url: user.user_metadata?.avatar_url || null
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation de l\'utilisateur avec MySQL:', error);
    }
  };

  // Récupérer tous les utilisateurs
  useEffect(() => {
    async function fetchUsers() {
      try {
        if (!user) return;
        
        const response = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${user.id}` } // Utiliser l'ID comme token simpliste
        });
        
        // Filtrer l'utilisateur actuel de la liste
        const filteredUsers = response.data.filter(u => u.id !== user?.id);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      }
    }

    if (user && activeTab === 'users') {
      fetchUsers();
    }
  }, [user, activeTab]);

  // Récupérer les fichiers de l'utilisateur
  const fetchFiles = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${user.id}` }
      });
      
      setUploadedFiles(response.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
    }
  };

  // Récupérer les utilisateurs suivis
  const fetchFollowedUsers = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${API_URL}/follows`, {
        headers: { Authorization: `Bearer ${user.id}` }
      });
      
      setFollowedUsers(response.data.map(item => item.followed_id));
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
    }
  };

  // Gérer le téléversement de fichiers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      
      // Créer un FormData pour l'upload du fichier
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      await axios.post(`${API_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.id}`
        }
      });
      
      // Après le téléversement, actualiser la liste des fichiers
      await fetchFiles();
      
      // Réinitialiser l'état
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      alert('Erreur lors du téléversement du fichier');
    } finally {
      setUploading(false);
    }
  };

  // Télécharger un fichier
  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${user.id}` },
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement et cliquer dessus
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  // Supprimer un fichier
  const deleteFile = async (fileId) => {
    try {
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${user.id}` }
      });
      
      // Actualiser la liste des fichiers
      await fetchFiles();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du fichier');
    }
  };

  // Suivre/Ne plus suivre un utilisateur
  const toggleFollow = async (userId) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      if (followedUsers.includes(userId)) {
        // Ne plus suivre
        await axios.delete(`${API_URL}/follows/${userId}`, {
          headers: { Authorization: `Bearer ${user.id}` }
        });
        
        setFollowedUsers(followedUsers.filter(id => id !== userId));
      } else {
        // Suivre
        await axios.post(`${API_URL}/follows`, 
          { followed_id: userId },
          { headers: { Authorization: `Bearer ${user.id}` }}
        );
        
        setFollowedUsers([...followedUsers, userId]);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'action de suivi:', error);
      alert('Erreur lors de l\'action de suivi');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour se connecter avec Google (inchangée)
  async function signInWithGoogle() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error.message);
      alert('Erreur de connexion avec Google');
    } finally {
      setLoading(false);
    }
  }

  // Se déconnecter (inchangé)
  async function signOut() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Déterminer le type de fichier pour l'icône
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    
    if (['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return icons.document;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
      return icons.image;
    } else if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(ext)) {
      return icons.video;
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      return icons.audio;
    } else {
      return icons.document;
    }
  };

  // Les styles restent identiques
  const getContainerStyle = () => {
    const baseStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '20px',
      margin: '20px auto',
      maxWidth: '100%',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      transition: 'all 0.3s ease',
      minHeight: '500px',
    };

    if (windowWidth < 480) {
      return {
        ...baseStyle,
        width: '95%',
        padding: '15px',
        minHeight: '400px',
      };
    } else if (windowWidth < 768) {
      return {
        ...baseStyle,
        width: '85%',
        maxWidth: '550px',
        minHeight: '450px',
      };
    } else if (windowWidth < 1200) {
      return {
        ...baseStyle,
        width: '70%',
        maxWidth: '700px',
      };
    } else {
      return {
        ...baseStyle,
        width: '60%',
        maxWidth: '900px',
        padding: '30px',
        fontSize: '1.2rem',
      };
    }
  };

  const getTabStyle = (isActive) => {
    return {
      padding: '10px 20px',
      margin: '0 5px',
      borderRadius: '20px',
      backgroundColor: isActive ? '#4285f4' : 'transparent',
      color: isActive ? 'white' : '#757575',
      border: isActive ? 'none' : '1px solid #dadce0',
      cursor: 'pointer',
      fontSize: windowWidth < 480 ? '14px' : '16px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      outline: 'none',
    };
  };

  const getButtonStyle = (primary = true, small = false) => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: small ? '4px' : '6px',
      padding: small ? '6px 12px' : (windowWidth < 480 ? '8px 16px' : '10px 20px'),
      fontSize: small ? '14px' : (windowWidth < 480 ? '14px' : '16px'),
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      outline: 'none',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      backgroundColor: primary ? '#4285f4' : 'white',
      color: primary ? 'white' : '#757575',
      border: primary ? 'none' : '1px solid #dadce0',
      margin: small ? '5px' : '10px',
      minWidth: small ? 'auto' : '120px',
    };
  };

  const getUserCardStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '15px',
      borderRadius: '8px',
      margin: '10px 0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#f8f9fa',
      width: '100%',
      maxWidth: '600px',
    };
  };

  const getFileCardStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      borderRadius: '6px',
      margin: '8px 0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#f8f9fa',
      width: '100%',
      maxWidth: '600px',
    };
  };

  const getUploadZoneStyle = (isDragActive) => {
    return {
      border: `2px dashed ${isDragActive ? '#4285f4' : '#ccc'}`,
      borderRadius: '8px',
      padding: '30px 20px',
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: isDragActive ? 'rgba(66, 133, 244, 0.05)' : 'transparent',
      transition: 'all 0.2s ease',
      marginTop: '20px',
      width: '100%',
      maxWidth: '600px',
    };
  };

  // Rendu du contenu en fonction de l'onglet actif
  const renderContent = () => {
    if (!user) {
      return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ color: '#333', marginBottom: '30px' }}>Connectez-vous pour accéder à toutes les fonctionnalités</h2>
          <button 
            onClick={signInWithGoogle} 
            disabled={loading}
            style={{
              ...getButtonStyle(),
              backgroundColor: 'white',
              color: '#757575',
              border: '1px solid #dadce0',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            aria-label="Se connecter avec Google"
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google logo" 
              style={{
                width: '20px',
                height: '20px',
                marginRight: '5px',
              }}
            />
            {loading ? 'Connexion en cours...' : 'Se connecter avec Google'}
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div style={{ textAlign: 'center', marginTop: '20px', width: '100%' }}>
            <h2 style={{ color: '#333' }}>
              Bienvenue, {user.user_metadata?.full_name || user.email || 'Utilisateur'}
            </h2>
            <p style={{ color: '#666' }}>Email: {user.email || 'Non disponible'}</p>
            {user.user_metadata?.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar utilisateur" 
                style={{
                  borderRadius: '50%',
                  margin: '15px 0',
                  width: windowWidth < 480 ? '60px' : windowWidth > 1200 ? '100px' : '80px',
                  height: windowWidth < 480 ? '60px' : windowWidth > 1200 ? '100px' : '80px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                }}
              />
            )}
            <div style={{ marginTop: '20px', width: '100%' }}>
              <h3 style={{ color: '#333', textAlign: 'left', marginBottom: '15px' }}>Mes fichiers récents</h3>
              {uploadedFiles.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto', width: '100%' }}>
                  {uploadedFiles.slice(0, 5).map((file) => (
                    <div key={file.id} style={getFileCardStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {getFileIcon(file.name)}
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: windowWidth < 480 ? '120px' : '200px',
                        }}>{file.name}</span>
                      </div>
                      <div>
                        <button
                          onClick={() => downloadFile(file.id, file.name)}
                          style={getButtonStyle(false, true)}
                        >
                          Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Aucun fichier téléversé</p>
              )}
              
              <button
                onClick={() => setActiveTab('upload')}
                style={{
                  ...getButtonStyle(),
                  marginTop: '20px',
                }}
              >
                {icons.upload}
                Téléverser des fichiers
              </button>
            </div>

            <button 
              onClick={signOut} 
              disabled={loading}
              style={{
                ...getButtonStyle(false),
                marginTop: '30px',
                backgroundColor: '#f44336',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              aria-label="Se déconnecter"
            >
              {loading ? 'Déconnexion...' : 'Se déconnecter'}
            </button>
          </div>
        );
      
      case 'upload':
        return (
          <div style={{ width: '100%', marginTop: '20px' }}>
            <h2 style={{ color: '#333', textAlign: 'center', marginBottom: '20px' }}>Téléverser des fichiers</h2>
            
            <div style={getUploadZoneStyle(false)} onClick={() => fileInputRef.current.click()}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                {icons.upload}
                <p style={{ margin: '0', color: '#666' }}>
                  Cliquez pour sélectionner un fichier ou déposez-le ici
                </p>
                {selectedFile && (
                  <div style={{ 
                    padding: '8px 12px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px' 
                  }}>
                    {getFileIcon(selectedFile.name)}
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
                style={{
                  ...getButtonStyle(),
                  opacity: !selectedFile || uploading ? 0.7 : 1,
                  cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Téléversement en cours...' : 'Téléverser'}
              </button>
            </div>
            
            <div style={{ marginTop: '30px', width: '100%' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>Mes fichiers</h3>
              {uploadedFiles.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto', width: '100%' }}>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} style={getFileCardStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {getFileIcon(file.name)}
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: windowWidth < 480 ? '100px' : '150px',
                        }}>{file.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => downloadFile(file.id, file.name)}
                          style={getButtonStyle(false, true)}
                        >
                          Télécharger
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          style={{
                            ...getButtonStyle(false, true),
                            backgroundColor: '#ffebee',
                            color: '#e53935',
                            borderColor: '#ffcdd2',
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Aucun fichier téléversé</p>
              )}
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div style={{ width: '100%', marginTop: '20px' }}>
            <h2 style={{ color: '#333', textAlign: 'center', marginBottom: '20px' }}>Utilisateurs</h2>
            
            {users.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto', width: '100%' }}>
                {users.map((profile) => (
                  <div key={profile.id} style={getUserCardStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={profile.avatar_url || 'https://via.placeholder.com/40'} 
                        alt={`Avatar de ${profile.full_name || 'utilisateur'}`}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <p style={{ margin: '0', fontWeight: '500' }}>{profile.full_name || 'Utilisateur'}</p>
                        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{profile.email || ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollow(profile.id)}
                      disabled={loading}
                      style={{
                        ...getButtonStyle(followedUsers.includes(profile.id), true),
                        backgroundColor: followedUsers.includes(profile.id) ? '#e57373' : '#4caf50',
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {followedUsers.includes(profile.id) ? (
                        <>{icons.unfollow} Ne plus suivre</>
                      ) : (
                        <>{icons.follow} Suivre</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                Aucun autre utilisateur trouvé
              </p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div style={getContainerStyle()}>
      {user && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            style={getTabStyle(activeTab === 'profile')}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </button>
          <button 
            style={getTabStyle(activeTab === 'upload')}
            onClick={() => setActiveTab('upload')}
          >
            Fichiers
          </button>
          <button 
            style={getTabStyle(activeTab === 'users')}
            onClick={() => setActiveTab('users')}
          >
            Utilisateurs
          </button>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

export default Profile;

