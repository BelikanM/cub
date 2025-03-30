import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';

const FileUploader = ({ currentUser }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [description, setDescription] = useState('');
  const [previewUrls, setPreviewUrls] = useState({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

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

  // Générer des prévisualisations pour les fichiers
  useEffect(() => {
    const newPreviewUrls = {};
    
    files.forEach(file => {
      if (!previewUrls[file.name] && file.type.startsWith('image/')) {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setPreviewUrls(prev => ({
            ...prev,
            [file.name]: fileReader.result
          }));
        };
        fileReader.readAsDataURL(file);
      }
    });
    
    return () => {
      // Nettoyer les URL des objets lors du démontage
      Object.values(previewUrls).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [files, previewUrls]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (fileName) => {
    setFiles(files.filter(file => file.name !== fileName));
    
    // Supprimer la prévisualisation si elle existe
    setPreviewUrls(prev => {
      const newPreviewUrls = { ...prev };
      if (newPreviewUrls[fileName]) {
        delete newPreviewUrls[fileName];
      }
      return newPreviewUrls;
    });
  };

  const handleUpload = async () => {
    if (!currentUser || files.length === 0) return;
    
    setUploading(true);
    
    try {
      // Formater la description si elle est présente
      const fileDescription = description.trim() || null;
      
      // Téléverser chaque fichier
      const uploadPromises = files.map(async (file) => {
        // Créer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        // Initialiser la progression pour ce fichier
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));
        
        // Options de téléversement avec suivi de la progression
        const options = {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percent
            }));
          }
        };
        
        // Téléverser le fichier vers le bucket "media"
        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(filePath, file, options);
          
        if (uploadError) throw uploadError;
        
        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        // Sauvegarder les métadonnées dans la table 'up'
        const { error: insertError } = await supabase
          .from('up')
          .insert([{
            user_id: currentUser.id,
            file_path: filePath,
            file_name: file.name,
            description: fileDescription,
            file_type: file.type,
            file_size: file.size,
            public_url: publicUrl,
            created_at: new Date().toISOString()
          }]);
          
        if (insertError) throw insertError;
        
        return { filePath, fileName: file.name };
      });
      
      await Promise.all(uploadPromises);
      
      // Réinitialiser le formulaire après un téléversement réussi
      setFiles([]);
      setDescription('');
      setPreviewUrls({});
      setUploadProgress({});
      
      alert('Fichiers téléversés avec succès!');
      
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      alert(`Erreur lors du téléversement: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Styles adaptatifs
  const isMobile = containerWidth < 500;
  const isTablet = containerWidth >= 500 && containerWidth < 768;

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    header: {
      marginBottom: '20px',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 10px 0',
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666',
      margin: '0',
    },
    uploadArea: {
      border: dragActive ? '2px dashed #4285F4' : '2px dashed #ccc',
      borderRadius: '8px',
      padding: '30px 20px',
      textAlign: 'center',
      backgroundColor: dragActive ? 'rgba(66, 133, 244, 0.05)' : '#ffffff',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      marginBottom: '20px',
    },
    uploadIcon: {
      fontSize: '3rem',
      color: '#4285F4',
      margin: '0 0 15px 0',
    },
    uploadText: {
      fontSize: '1rem',
      color: '#666',
      margin: '0 0 15px 0',
    },
    fileInput: {
      display: 'none',
    },
    browseButton: {
      backgroundColor: '#4285F4',
      color: '#ffffff',
      border: 'none',
      borderRadius: '20px',
      padding: '8px 20px',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      display: 'inline-block',
      '&:hover': {
        backgroundColor: '#3367d6',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    },
    descriptionField: {
      width: '100%',
      padding: '12px 15px',
      fontSize: '14px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      outline: 'none',
      marginBottom: '20px',
      transition: 'all 0.3s ease',
      resize: 'vertical',
      minHeight: '80px',
      backgroundColor: '#ffffff',
      '&:focus': {
        borderColor: '#4285F4',
        boxShadow: '0 0 0 2px rgba(66, 133, 244, 0.3)',
      },
    },
    previewSection: {
      marginBottom: '20px',
    },
    previewTitle: {
      fontSize: '1rem',
      fontWeight: '500',
      marginBottom: '10px',
      color: '#333',
    },
    previewGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile 
        ? '1fr' 
        : isTablet 
          ? 'repeat(2, 1fr)' 
          : 'repeat(3, 1fr)',
      gap: '15px',
    },
    previewItem: {
      position: 'relative',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
      },
    },
    previewImage: {
      width: '100%',
      height: '160px',
      objectFit: 'cover',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      backgroundColor: '#f1f1f1',
    },
    fileIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '160px',
      backgroundColor: '#f5f5f5',
      fontSize: '2rem',
      color: '#757575',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    },
    fileInfo: {
      padding: '12px',
    },
    fileName: {
      fontSize: '0.9rem',
      fontWeight: '500',
      margin: '0 0 5px 0',
      wordBreak: 'break-all',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    fileSize: {
      fontSize: '0.8rem',
      color: '#757575',
      margin: '0',
    },
    removeButton: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: '#ffffff',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    },
    progressBar: {
      height: '6px',
      backgroundColor: '#e0e0e0',
      borderRadius: '3px',
      overflow: 'hidden',
      margin: '5px 0',
    },
    progressFill: (percent) => ({
      height: '100%',
      width: `${percent}%`,
      backgroundColor: '#4CAF50',
      transition: 'width 0.3s ease',
    }),
    uploadButton: {
      backgroundColor: '#4285F4',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 25px',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isMobile ? '100%' : 'auto',
      '&:hover': {
        backgroundColor: '#3367d6',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
      '&:disabled': {
        backgroundColor: '#b0bec5',
        cursor: 'not-allowed',
        transform: 'none',
      },
    },
    uploadButtonIcon: {
      marginRight: '8px',
    },
    emptyState: {
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      textAlign: 'center',
      marginBottom: '20px',
    },
    emptyStateText: {
      fontSize: '1rem',
      color: '#757575',
      margin: '0',
    },
  };

  // Formater la taille du fichier pour l'affichage
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Déterminer l'icône à afficher selon le type de fichier
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    return '📁';
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.header}>
        <h2 style={styles.title}>Partager du contenu</h2>
        <p style={styles.subtitle}>Téléversez des images, vidéos et autres fichiers pour les partager</p>
      </div>

      <div 
        style={styles.uploadArea}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div style={styles.uploadIcon}>📤</div>
        <p style={styles.uploadText}>
          Glissez-déposez vos fichiers ici ou cliquez pour parcourir
        </p>
        <button 
          style={{...styles.browseButton, '&:hover': styles.browseButton['&:hover']}} 
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current.click();
          }}
        >
          Parcourir
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={styles.fileInput}
          onChange={handleFileChange}
          multiple
          disabled={uploading}
        />
      </div>

      <textarea
        style={{...styles.descriptionField, '&:focus': styles.descriptionField['&:focus']}}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ajoutez une description à votre publication..."
        disabled={uploading}
      />

      {files.length > 0 && (
        <div style={styles.previewSection}>
          <h3 style={styles.previewTitle}>Fichiers sélectionnés ({files.length})</h3>
          <div style={styles.previewGrid}>
            {files.map((file, index) => (
              <div key={`${file.name}_${index}`} style={styles.previewItem}>
                {file.type.startsWith('image/') && previewUrls[file.name] ? (
                  <img 
                    src={previewUrls[file.name]} 
                    alt={`Aperçu de ${file.name}`} 
                    style={styles.previewImage}
                  />
                ) : (
                  <div style={styles.fileIcon}>
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div style={styles.fileInfo}>
                  <p style={styles.fileName} title={file.name}>{file.name}</p>
                  <p style={styles.fileSize}>{formatFileSize(file.size)}</p>
                  {uploadProgress[file.name] > 0 && (
                    <div style={styles.progressBar}>
                      <div style={styles.progressFill(uploadProgress[file.name])}></div>
                    </div>
                  )}
                </div>
                <button 
                  style={{...styles.removeButton, '&:hover': styles.removeButton['&:hover']}} 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  disabled={uploading}
                  aria-label={`Supprimer ${file.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        style={{
          ...styles.uploadButton, 
          '&:hover': styles.uploadButton['&:hover'],
          '&:active': files.length > 0 && !uploading ? styles.uploadButton['&:active'] : {},
          ...(!files.length || uploading ? styles.uploadButton['&:disabled'] : {})
        }} 
        onClick={handleUpload}
        disabled={!files.length || uploading}
      >
        <span style={styles.uploadButtonIcon}>
          {uploading ? '⏳' : '📤'}
        </span>
        {uploading ? 'Téléversement en cours...' : 'Téléverser les fichiers'}
      </button>
    </div>
  );
};

export default FileUploader;

