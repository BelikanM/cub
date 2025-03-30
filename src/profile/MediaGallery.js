import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const MediaGallery = ({ currentUser }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'

  const containerRef = useRef(null);
  const modalRef = useRef(null);

  // Observer la taille du conteneur pour le responsive
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Charger les médias de l'utilisateur au chargement
  useEffect(() => {
    if (!currentUser) return;
    
    const loadMedia = async () => {
      try {
        setLoading(true);
        
        // Récupérer les médias de l'utilisateur depuis la table 'up'
        const { data, error } = await supabase
          .from('up')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setMedia(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des médias:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMedia();
    
    // Abonnement aux changements en temps réel
    const subscription = supabase
      .channel('media-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'up',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          // Mettre à jour l'interface selon le type d'événement
          if (payload.eventType === 'INSERT') {
            setMedia(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setMedia(prev => prev.filter(item => item.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMedia(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  // Gestionnaire pour fermer le modal quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };
    
    if (modalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen]);

  // Fermer le modal et réinitialiser les états
  const closeModal = () => {
    setModalOpen(false);
    setSelectedMedia(null);
    setIsEditing(false);
    setEditDescription('');
    setDeleting(false);
  };

  // Ouvrir le modal avec le média sélectionné
  const openMediaDetail = (item) => {
    setSelectedMedia(item);
    setEditDescription(item.description || '');
    setModalOpen(true);
  };

  // Mettre à jour la description d'un média
  const updateMediaDescription = async () => {
    if (!selectedMedia) return;
    
    try {
      setIsEditing(true);
      
      const { error } = await supabase
        .from('up')
        .update({ description: editDescription })
        .eq('id', selectedMedia.id);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setSelectedMedia({ ...selectedMedia, description: editDescription });
      setIsEditing(false);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la description:', error);
      setIsEditing(false);
    }
  };

  // Supprimer un média
  const deleteMedia = async () => {
    if (!selectedMedia) return;
    
    try {
      setDeleting(true);
      
      // Supprimer d'abord le fichier du stockage
      const { error: storageError } = await supabase
        .storage
        .from('uploads')
        .remove([selectedMedia.storage_path]);
        
      if (storageError) throw storageError;
      
      // Puis supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('up')
        .delete()
        .eq('id', selectedMedia.id);
        
      if (dbError) throw dbError;
      
      closeModal();
      
    } catch (error) {
      console.error('Erreur lors de la suppression du média:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Déterminer le nombre de colonnes selon la taille du conteneur
  const getGridColumns = () => {
    if (containerWidth < 640) return 'grid-cols-1';
    if (containerWidth < 768) return 'grid-cols-2';
    if (containerWidth < 1024) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  // Formatter la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Déterminer le type de média (image, vidéo, audio, etc.)
  const getMediaType = (item) => {
    const mimeType = item.mime_type || '';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  // Rendu du média selon son type
  const renderMedia = (item, fullSize = false) => {
    const mediaType = getMediaType(item);
    const url = `${supabase.storageUrl}/object/public/uploads/${item.storage_path}`;
    
    switch (mediaType) {
      case 'image':
        return (
          <img 
            src={url} 
            alt={item.description || item.file_name} 
            className={`${fullSize ? 'max-h-[70vh] max-w-full' : 'h-48 w-full'} object-cover rounded-md`}
          />
        );
      case 'video':
        return (
          <video 
            src={url} 
            controls 
            className={`${fullSize ? 'max-h-[70vh] max-w-full' : 'h-48 w-full'} object-cover rounded-md`}
          />
        );
      case 'audio':
        return (
          <div className="p-4 flex flex-col items-center justify-center bg-gray-100 rounded-md">
            <div className="text-2xl mb-2">🎵</div>
            <audio src={url} controls className="w-full" />
            <div className="mt-2 text-sm text-gray-600 truncate w-full text-center">
              {item.file_name}
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 flex flex-col items-center justify-center bg-gray-100 rounded-md">
            <div className="text-4xl mb-2">📄</div>
            <div className="text-sm text-gray-600 truncate w-full text-center">
              {item.file_name}
            </div>
            <a 
              href={url} 
              download={item.file_name}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Télécharger
            </a>
          </div>
        );
    }
  };

  // Rendu principal du composant
  return (
    <div className="container mx-auto px-4 py-8" ref={containerRef}>
      {/* Contrôles */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Ma Galerie Média</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Grille
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Affichage des médias en grille */}
      {!loading && media.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Aucun média n'a été trouvé. Commencez par télécharger vos fichiers.</p>
        </div>
      )}

      {!loading && media.length > 0 && viewMode === 'grid' && (
        <div className={`grid ${getGridColumns()} gap-4`}>
          {media.map(item => (
            <div 
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
              onClick={() => openMediaDetail(item)}
            >
              <div className="h-48 overflow-hidden">
                {renderMedia(item)}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 truncate">{item.file_name}</h3>
                <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at)}</p>
                {item.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Affichage des médias en liste */}
      {!loading && media.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {media.map(item => (
              <li 
                key={item.id}
                className="p-4 flex items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => openMediaDetail(item)}
              >
                <div className="w-16 h-16 mr-4 flex-shrink-0 rounded overflow-hidden">
                  {renderMedia(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 truncate">{item.file_name}</h3>
                  <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de détail */}
      {modalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Entête du modal */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium truncate">
                {selectedMedia.file_name}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Corps du modal */}
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center">
              {renderMedia(selectedMedia, true)}
            </div>
            
            {/* Informations et actions */}
            <div className="p-4 border-t">
              <div className="mb-4">
                <div className="text-sm text-gray-500">
                  Ajouté le {formatDate(selectedMedia.created_at)}
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                    className="w-full border rounded-md p-2 text-sm"
                    placeholder="Ajouter une description..."
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={deleteMedia}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
                
                <button
                  onClick={updateMediaDescription}
                  disabled={isEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isEditing ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;


