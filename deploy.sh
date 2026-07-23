#!/bin/bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT AUTOMATISÉ - PORTAIL DE VEILLE CARRIÈRE (@lfriiactu)
# Conçu pour Linux Mint - 100% Gratuit & Optimisé pour l'Espace Disque
# Utilisation rigoureuse de chemins absolus récapitulés dynamiquement
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Resolution absolue du répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
CLOUDFLARE_DIR="${SCRIPT_DIR}/cloudflare"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
SCHEMA_SQL="${CLOUDFLARE_DIR}/schema.sql"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}   Lancement du Déploiement du Portail Veille Carrière  ${NC}"
echo -e "${BLUE}  Répertoire Racine (Absolu) : ${SCRIPT_DIR}  ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Nettoyage préliminaire et gestion de l'espace disque
echo -e "\n${YELLOW}[1/6] Optimisation de l'espace disque & nettoyage cache...${NC}"
npm cache clean --force 2>/dev/null || true
rm -rf ~/.npm/_cacache
sudo apt-get clean 2>/dev/null || true
echo "Espace disque nettoyé avec succès."

# 2. Vérification / Installation des dépendances système
echo -e "\n${YELLOW}[2/6] Vérification des prérequis Linux Mint...${NC}"

if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Installation..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✓ Node.js est déjà installé ($(node -v))"
fi

if ! command -v python3 &> /dev/null; then
    echo "Python3 n'est pas installé. Installation..."
    sudo apt-get update && sudo apt-get install -y python3 python3-pip
else
    echo "✓ Python3 est déjà installé ($(python3 --version))"
fi

pip3 install beautifulsoup4 requests --break-system-packages --quiet 2>/dev/null || true

# 3. Installation de Cloudflare Wrangler (CLI)
echo -e "\n${YELLOW}[3/6] Configuration des outils Cloudflare...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo "Installation de Cloudflare Wrangler..."
    npm install -g wrangler
else
    echo "✓ Wrangler CLI est disponible."
fi

# 4. Authentification Cloudflare
echo -e "\n${YELLOW}[4/6] Connexion à Cloudflare...${NC}"
echo -e "${BLUE}Une fenêtre de navigateur va s'ouvrir si vous n'êtes pas connecté.${NC}"
wrangler login

# 5. Création et configuration de la base de données D1 (Gratuit)
echo -e "\n${YELLOW}[5/6] Initialisation de la Base de Données Cloudflare D1...${NC}"
DB_NAME="lfrii_jobs_db"

if ! wrangler d1 list | grep -q "$DB_NAME"; then
    echo "Création de la base de données $DB_NAME..."
    wrangler d1 create $DB_NAME
    echo -e "${RED}IMPORTANT:${NC} Copiez le 'database_id' affiché ci-dessus et mettez-le à jour dans ${CLOUDFLARE_DIR}/wrangler.toml si nécessaire."
else
    echo "✓ Base de données D1 '$DB_NAME' détectée."
fi

echo "Exécution du schéma SQL de structure (${SCHEMA_SQL})..."
wrangler d1 execute $DB_NAME --file="${SCHEMA_SQL}" --remote || true

# 6. Déploiement des services Cloudflare Workers & Pages via Chemins Absolus
echo -e "\n${YELLOW}[6/6] Déploiement de l'API Worker et du Front-End...${NC}"

cd "${CLOUDFLARE_DIR}"
wrangler deploy
cd "${SCRIPT_DIR}"

echo "Déploiement de l'interface web depuis ${FRONTEND_DIR}..."
wrangler pages deploy "${FRONTEND_DIR}" --project-name=portail-emploi-lfrii

echo -e "\n${YELLOW}Nettoyage final après déploiement...${NC}"
npm cache clean --force 2>/dev/null || true

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}   Félicitations ! Votre portail est 100% en ligne !   ${NC}"
echo -e "${GREEN}=====================================================${NC}"
