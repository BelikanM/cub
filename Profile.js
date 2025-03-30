// src/Profile.js
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Profile = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Charger l'utilisateur actuel et ses publications au chargement du composant
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        setError("Impossible de récupérer les informations d'utilisateur");
      } else {
        setUser(user);
        fetchPosts();
      }
      setLoading(false);
    };

    getUser();
    
    // S'abonner aux changements en temps réel de la table 'up'
    const subscription = supabase.channel('public:up')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'up' }, 
        (payload) => {
          fetchPosts();
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Récupérer les publications
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('up')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des publications:", err);
      setError("Impossible de charger les publications");
    } finally {
      setLoading(false);
    }
  };

  // Publier un nouveau message
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPost.trim() && !imageUrl) return;
    
    try {
      const { data, error } = await supabase
        .from('up')
        .insert([
          { 
            content: newPost.trim(),
            user_id: user.id,
            user_name: user.email,
            image_url: imageUrl || null
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Réinitialiser le formulaire
      setNewPost('');
      setImageUrl('');
    } catch (err) {
      console.error("Erreur lors de la publication:", err);
      setError("Impossible de publier votre message");
    }
  };

  // Gérer le téléchargement d'images
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      
      // Télécharger le fichier dans le bucket 'posts'
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Obtenir l'URL publique
      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);
        
      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error("Erreur lors du téléchargement de l'image:", err);
      setError("Impossible de télécharger l'image");
    } finally {
      setIsUploading(false);
    }
  };

  // Formatter la date de création
  const formatPostDate = (dateString) => {
    return format(new Date(dateString), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  // Fonction pour supprimer une publication
  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('up')
        .delete()
        .eq('id', postId);
        
      if (error) throw error;
    } catch (err) {
      console.error("Erreur lors de la suppression de la publication:", err);
      setError("Impossible de supprimer la publication");
    }
  };

  // Fonction pour aimer une publication
  const handleLikePost = async (postId, currentLikes) => {
    try {
      const { error } = await supabase
        .from('up')
        .update({ likes: (currentLikes || 0) + 1 })
        .eq('id', postId)
        .select();
        
      if (error) throw error;
    } catch (err) {
      console.error("Erreur lors de l'ajout d'un like:", err);
      setError("Impossible d'aimer cette publication");
    }
  };

  if (loading && posts.length === 0) {
    return <div className="flex justify-center p-6">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      {user ? (
        <>
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Profil de {user.email}</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handlePostSubmit}>
                <textarea
                  className="w-full p-2 border rounded mb-3"
                  rows="3"
                  placeholder="Quoi de neuf ?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                ></textarea>
                
                {imageUrl && (
                  <div className="mb-3 relative">
                    <img 
                      src={imageUrl} 
                      alt="Aperçu" 
                      className="max-h-64 rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      onClick={() => setImageUrl('')}
                    >
                      &times;
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div>
                    <button
                      type="button"
                      className="text-blue-600 mr-3"
                      onClick={() => fileInputRef.current.click()}
                    >
                      📷 Photo
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={(!newPost.trim() && !imageUrl) || isUploading}
                  >
                    {isUploading ? "Téléchargement..." : "Publier"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white shadow rounded-lg">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{post.user_name || "Utilisateur anonyme"}</h3>
                    <p className="text-gray-500 text-sm">
                      {post.created_at ? formatPostDate(post.created_at) : "Date inconnue"}
                    </p>
                  </div>
                  {user.id === post.user_id && (
                    <button
                      className="text-gray-500 hover:text-red-600"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <p className="whitespace-pre-line">{post.content}</p>
                  {post.image_url && (
                    <div className="mt-3">
                      <img 
                        src={post.image_url} 
                        alt="Publication" 
                        className="max-w-full rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 border-t flex justify-between">
                  <button
                    className="text-gray-600 hover:text-blue-600 flex items-center"
                    onClick={() => handleLikePost(post.id, post.likes)}
                  >
                    👍 J'aime {post.likes ? `(${post.likes})` : ''}
                  </button>
                  <button
                    className="text-gray-600 hover:text-blue-600"
                  >
                    💬 Commenter
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 && !loading && (
              <div className="text-center p-6 bg-white shadow rounded-lg">
                Aucune publication pour le moment. Soyez le premier à publier !
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-6 bg-white shadow rounded-lg">
          Veuillez vous connecter pour voir votre profil et publier du contenu.
        </div>
      )}
    </div>
  );
};

export default Profile;


