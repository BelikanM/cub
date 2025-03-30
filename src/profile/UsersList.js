import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const UsersList = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [followings, setFollowings] = useState([]);
  const [containerWidth, setContainerWidth] = useState(0);

  // Référence pour mesurer la largeur du conteneur
  const containerRef = React.useRef(null);

  // Observer la taille du conteneur
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

  // Récupérer tous les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Charger les utilisateurs depuis Supabase Auth
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) throw authError;
        
        // Alternative: si l'Admin API n'est pas accessible, utilisez une table users séparée
        // const { data: dbUsers, error: dbError } = await supabase.from('users').select('*');
        // if (dbError) throw dbError;
        
        // Filtrer l'utilisateur actuel
        const otherUsers = authUsers?.filter(user => user.id !== currentUser?.id) || [];
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
        
        // Charger les relations d'abonnement de l'utilisateur courant
        if (currentUser) {
          const { data: followData } = await supabase
            .from('up')
            .select('followed_id')
            .eq('follower_id', currentUser.id);
            
          const followingIds = followData?.map(follow => follow.followed_id) || [];
          setFollowings(followingIds);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentUser]);

  // Filtrer les utilisateurs lors de la recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.user_metadata?.full_name && 
         user.user_metadata.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Gérer l'abonnement/désabonnement à un utilisateur
  const handleFollowToggle = async (userId) => {
    if (!currentUser) return;
    
    try {
      if (followings.includes(userId)) {
        // Désabonnement
        await supabase
          .from('up')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', userId);
          
        setFollowings(followings.filter(id => id !== userId));
      } else {
        // Abonnement
        await supabase
          .from('up')
          .insert([{ 
            follower_id: currentUser.id, 
            followed_id: userId,
            created_at: new Date().toISOString() 
          }]);
          
        setFollowings([...followings, userId]);
      }
    } catch (error) {
      console.error('Erreur lors de la modification de l\'abonnement:', error);
    }
  };

  // Déterminer si la liste doit défiler horizontalement ou verticalement
  const shouldScrollHorizontally = containerWidth < 768 && filteredUsers.length > 3;

  // Styles
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
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexDirection: containerWidth < 500 ? 'column' : 'row',
      gap: containerWidth < 500 ? '15px' : '0',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333',
      margin: '0',
    },
    searchContainer: {
      position: 'relative',
      width: containerWidth < 500 ? '100%' : '300px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 15px 12px 40px',
      fontSize: '14px',
      border: '1px solid #e0e0e0',
      borderRadius: '30px',
      backgroundColor: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s',
      '&:focus': {
        boxShadow: '0 0 0 2px rgba(66, 133, 244, 0.3)',
        borderColor: '#4285F4',
      },
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9e9e9e',
    },
    userListWrapper: {
      overflow: 'auto',
      maxHeight: shouldScrollHorizontally ? 'auto' : '500px',
      overflowX: shouldScrollHorizontally ? 'auto' : 'hidden',
      overflowY: shouldScrollHorizontally ? 'hidden' : 'auto',
      padding: '10px 0',
      scrollbarWidth: 'thin',
      scrollbarColor: '#d1d1d1 #f1f1f1',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#d1d1d1',
        borderRadius: '10px',
        '&:hover': {
          background: '#c1c1c1',
        },
      },
    },
    userList: {
      display: shouldScrollHorizontally ? 'flex' : 'grid',
      gridTemplateColumns: containerWidth < 768 
        ? '1fr' 
        : containerWidth < 1024 
          ? 'repeat(2, 1fr)' 
          : 'repeat(3, 1fr)',
      gap: '15px',
      width: shouldScrollHorizontally ? 'max-content' : '100%',
    },
    userCard: {
      display: 'flex',
      flexDirection: shouldScrollHorizontally ? 'column' : 'row',
      alignItems: 'center',
      padding: '15px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      width: shouldScrollHorizontally ? '240px' : 'auto',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
    userAvatar: {
      width: shouldScrollHorizontally ? '80px' : '60px',
      height: shouldScrollHorizontally ? '80px' : '60px',
      borderRadius: '50%',
      objectFit: 'cover',
      backgroundColor: '#f1f1f1',
      marginRight: shouldScrollHorizontally ? '0' : '15px',
      marginBottom: shouldScrollHorizontally ? '10px' : '0',
    },
    userInfo: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: shouldScrollHorizontally ? 'center' : 'flex-start',
      textAlign: shouldScrollHorizontally ? 'center' : 'left',
    },
    userName: {
      fontWeight: 'bold',
      fontSize: '1rem',
      margin: '0 0 5px 0',
      wordBreak: 'break-word',
    },
    userEmail: {
      fontSize: '0.9rem',
      color: '#666',
      margin: '0 0 10px 0',
      wordBreak: 'break-all',
    },
    followButton: {
      backgroundColor: (userId) => followings.includes(userId) ? '#e1f5fe' : '#4285F4',
      color: (userId) => followings.includes(userId) ? '#0277bd' : '#ffffff',
      border: 'none',
      borderRadius: '20px',
      padding: '8px 15px',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: shouldScrollHorizontally ? '100%' : 'auto',
      '&:hover': {
        backgroundColor: (userId) => followings.includes(userId) ? '#b3e5fc' : '#3367d6',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    emptyStateText: {
      fontSize: '1rem',
      color: '#757575',
      textAlign: 'center',
      margin: '10px 0 0 0',
    },
    loadingState: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
    },
  };

  // Loaders et états
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div>Chargement des utilisateurs...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.header}>
        <h2 style={styles.title}>Découvrir des utilisateurs</h2>
        <div style={styles.searchContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{...styles.searchInput, '&:focus': styles.searchInput['&:focus']}}
            aria-label="Rechercher un utilisateur"
          />
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div style={styles.userListWrapper}>
          <div style={styles.userList}>
            {filteredUsers.map((user) => (
              <div key={user.id} style={styles.userCard}>
                <img
                  src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`}
                  alt={`Avatar de ${user.user_metadata?.full_name || user.email}`}
                  style={styles.userAvatar}
                />
                <div style={styles.userInfo}>
                  <h3 style={styles.userName}>
                    {user.user_metadata?.full_name || 'Utilisateur'}
                  </h3>
                  <p style={styles.userEmail}>{user.email}</p>
                  <button
                    onClick={() => handleFollowToggle(user.id)}
                    style={{
                      ...styles.followButton,
                      backgroundColor: followings.includes(user.id) ? '#e1f5fe' : '#4285F4',
                      color: followings.includes(user.id) ? '#0277bd' : '#ffffff',
                      '&:hover': {
                        backgroundColor: followings.includes(user.id) ? '#b3e5fc' : '#3367d6',
                      }
                    }}
                    aria-label={followings.includes(user.id) ? `Se désabonner de ${user.email}` : `S'abonner à ${user.email}`}
                  >
                    {followings.includes(user.id) ? 'Abonné' : 'S\'abonner'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {searchTerm 
              ? 'Aucun utilisateur ne correspond à votre recherche.' 
              : 'Aucun utilisateur disponible pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersList;

