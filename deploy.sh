#!/bin/bash

# Configuration du repo
REPO_URL="https://github.com/melvinbretonpro-coder/focus-dashboard.git"

echo "🚀 Initialisation du déploiement..."

# Initialisation Git si nécessaire
if [ ! -d ".git" ]; then
    git init
fi

# Configuration du remote
git remote remove origin 2>/dev/null
git remote add origin $REPO_URL

# Branche main
git branch -M main

# Préparation des fichiers
git add .

# Commit (si il y a des changements)
git commit -m "🚀 Déploiement Focus Dashboard" || echo "Pas de nouveaux changements à committer"

# Push
echo "📤 Envoi vers GitHub..."
git push -u origin main --force

echo "✅ Terminé !"
