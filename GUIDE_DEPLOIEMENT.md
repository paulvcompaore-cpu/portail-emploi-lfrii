# 📘 Guide de Déploiement : Explication "Pas à Pas pour un Enfant de 10 ans" (Version Chemins Absolus)

Bienvenue dans le guide de ton nouveau **Portail Magique de Recherche d'Emploi** ! 🚀

---

## 🔒 Sécurité des Chemins Absolus : Pourquoi c'est important ?
Tous les scripts (`deploy.sh`, `fetch_telegram.py`, `.github/workflows/ingest.yml`) ont été mis à jour avec une **résolution dynamique de chemins absolus**.
Que tu lances le script depuis ton dossier principal, ton bureau ou un autre terminal, le système sait **exactement** où trouver chaque fichier sans jamais se tromper !

---

## 🛠️ Comment Tout Installer Depuis ton Ordinateur (Linux Mint)

### Étape 1 : Ouvre ton Terminal
Sur ton ordinateur Linux Mint, appuie sur : `CTRL` + `ALT` + `T`

### Étape 2 : Décompresse le Fichier `v2`
```bash
cd ~/Téléchargements
unzip portail_veille_carriere_lfrii_v2.zip
cd portail_veille_carriere_lfrii_v2
```

### Étape 3 : Donne les droits d'exécution au Script
```bash
chmod +x deploy.sh
```

### Étape 4 : Lance le Déploiement Automatique !
```bash
./deploy.sh
```

---

🎉 **Voilà ! Tous les chemins sont sécurisés et ton portail est prêt !**
