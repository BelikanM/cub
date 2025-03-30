# Créer les dossiers
mkdir -p src/fb/components src/services

# Créer les fichiers vides
touch src/App.js src/Profile.js src/fb/Feed.js src/services/prismaClient.js
touch src/fb/components/CreatePost.js src/fb/components/Post.js src/fb/components/CommentSection.js
touch src/fb/components/ProfileHeader.js src/fb/components/ProfileInfo.js

# Remplir App.js avec un contenu de base
cat > src/App.js << 'EOL'
import React from 'react';
import Profile from './Profile';
import Feed from './fb/Feed';

function App() {
  return (
    <div className="App">
      <h1>Mon Application</h1>
      <Profile />
      <Feed />
    </div>
  );
}

export default App;
EOL

# Remplir Profile.js avec un contenu de base
cat > src/Profile.js << 'EOL'
import React from 'react';
import ProfileHeader from './fb/components/ProfileHeader';
import ProfileInfo from './fb/components/ProfileInfo';

function Profile() {
  return (
    <div className="profile">
      <h2>Page de profil</h2>
      <ProfileHeader />
      <ProfileInfo />
    </div>
  );
}

export default Profile;
EOL

# Remplir Feed.js avec un contenu de base
cat > src/fb/Feed.js << 'EOL'
import React from 'react';
import CreatePost from './components/CreatePost';
import Post from './components/Post';

function Feed() {
  return (
    <div className="feed">
      <h2>Fil d'actualités</h2>
      <CreatePost />
      <Post />
    </div>
  );
}

export default Feed;
EOL

# Remplir prismaClient.js avec le code d'initialisation de Prisma
cat > src/services/prismaClient.js << 'EOL'
import { PrismaClient } from '@prisma/client';

let prisma;

// Éviter de créer plusieurs instances en mode développement
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
EOL

# Remplir les composants avec du contenu de base
cat > src/fb/components/CreatePost.js << 'EOL'
import React, { useState } from 'react';

function CreatePost() {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logique pour créer un post
    console.log('Post créé:', content);
    setContent('');
  };

  return (
    <div className="create-post">
      <h3>Créer un post</h3>
      <form onSubmit={handleSubmit}>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          placeholder="Quoi de neuf ?"
        />
        <button type="submit">Publier</button>
      </form>
    </div>
  );
}

export default CreatePost;
EOL

cat > src/fb/components/Post.js << 'EOL'
import React from 'react';
import CommentSection from './CommentSection';

function Post() {
  return (
    <div className="post">
      <div className="post-header">
        <img src="https://via.placeholder.com/50" alt="Avatar" />
        <div>
          <h4>Nom d'utilisateur</h4>
          <p>Il y a 2 heures</p>
        </div>
      </div>
      <div className="post-content">
        <p>Ceci est un exemple de contenu de post...</p>
      </div>
      <div className="post-actions">
        <button>J'aime</button>
        <button>Commenter</button>
        <button>Partager</button>
      </div>
      <CommentSection />
    </div>
  );
}

export default Post;
EOL

cat > src/fb/components/CommentSection.js << 'EOL'
import React, { useState } from 'react';

function CommentSection() {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { id: 1, author: 'Utilisateur 1', text: 'Super post !' },
    { id: 2, author: 'Utilisateur 2', text: 'Je suis d\'accord.' }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      const newComment = {
        id: comments.length + 1,
        author: 'Vous',
        text: comment
      };
      setComments([...comments, newComment]);
      setComment('');
    }
  };

  return (
    <div className="comment-section">
      <h4>Commentaires</h4>
      <div className="comments-list">
        {comments.map(c => (
          <div key={c.id} className="comment">
            <strong>{c.author}</strong>
            <p>{c.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
        />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}

export default CommentSection;
EOL

cat > src/fb/components/ProfileHeader.js << 'EOL'
import React from 'react';

function ProfileHeader() {
  return (
    <div className="profile-header">
      <div className="cover-photo">
        <img src="https://via.placeholder.com/800x200" alt="Couverture" />
      </div>
      <div className="profile-picture">
        <img src="https://via.placeholder.com/150" alt="Photo de profil" />
      </div>
      <h1>Nom d'utilisateur</h1>
      <div className="profile-actions">
        <button>Modifier le profil</button>
        <button>Ajouter une histoire</button>
      </div>
    </div>
  );
}

export default ProfileHeader;
EOL

cat > src/fb/components/ProfileInfo.js << 'EOL'
import React from 'react';

function ProfileInfo() {
  return (
    <div className="profile-info">
      <div className="about-section">
        <h3>À propos</h3>
        <ul>
          <li><strong>Travaille à :</strong> Entreprise ABC</li>
          <li><strong>Habite à :</strong> Paris, France</li>
          <li><strong>De :</strong> Lyon, France</li>
          <li><strong>En couple avec :</strong> Nom du partenaire</li>
          <li><strong>A rejoint le :</strong> Janvier 2020</li>
        </ul>
      </div>
      <div className="friends-section">
        <h3>Amis</h3>
        <p>254 amis</p>
        <div className="friends-grid">
          {/* Placeholders pour les amis */}
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="friend-item">
              <img src={`https://via.placeholder.com/80?text=Ami${i+1}`} alt={`Ami ${i+1}`} />
              <p>Ami {i+1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfileInfo;
EOL

echo "Structure de fichiers créée avec succès!"

