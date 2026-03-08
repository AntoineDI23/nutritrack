# NutriTrack

## DESCRIPTION

NutriTrack est une application mobile développée avec **React Native**, **Expo Router** et **Clerk**.

Elle permet de :

- créer un compte utilisateur et se connecter
- ajouter des repas
- rechercher des aliments grâce à l’API **Open Food Facts**
- scanner un code-barres pour récupérer automatiquement les informations d’un produit
- consulter les détails nutritionnels d’un repas
- définir un objectif calorique journalier
- visualiser sa progression calorique sur l’écran d’accueil
- sauvegarder les données localement avec **SQLite**

L’application est organisée en 3 onglets principaux :

- **Accueil** : liste des repas enregistrés, regroupés par date, avec résumé nutritionnel quotidien
- **Ajouter** : création d’un repas par recherche de texte ou scan de code-barres
- **Profil** : affichage de l’adresse e-mail et déconnexion, avec définition de l’objectif calorique

Les données alimentaires sont fournies par l’API **Open Food Facts**.

---

## PRÉREQUIS

Aucun prérequis technique n’est supposé.

Avant de lancer le projet, il faut simplement installer les outils suivants :

### 1. Installer Node.js

Le projet utilise **Node.js** et **npm**.

- Aller sur le site officiel de Node.js
- Télécharger la dernière version **LTS**
- Installer Node.js

> `npm` est installé automatiquement avec Node.js.

Pour vérifier que l’installation a fonctionné, ouvrir un terminal puis taper :

```bash
node -v
npm -v
```

### 2. Installer Git

Git permet de récupérer le projet depuis GitHub.

- Aller sur le site officiel de Git
- Télécharger Git
- L’installer avec les options par défaut

Pour vérifier l’installation :

```bash
git --version
```

### 3. Avoir un compte Clerk

L’application utilise **Clerk** pour l’authentification.

Il faut donc :

- créer un compte Clerk
- créer une application Clerk
- récupérer la **Publishable Key**

Cette clé devra être placée dans un fichier `.env`.


### 4. Avoir un smartphone ou un émulateur (optionnel mais recommandé)

L’application peut être lancée :

- sur un téléphone avec **Expo Go**
- sur un émulateur Android
- sur un simulateur iOS (Mac uniquement)

> Pour tester la caméra et le scan de code-barres, un **vrai téléphone** est recommandé.

---

## INSTALLATION ET LANCEMENT

### 1. Cloner le projet

Dans un terminal, tapez :

```bash
git clone https://github.com/AntoineDI23/nutritrack.git
```

Puis entrez dans le dossier du projet :
```bash
cd VOTRE_REPOSITORY
```

### 2. Installer les dépendances

Dans le dossier du projet, tapez :
```bash
npm install
```

Cette commande installe toutes les bibliothèques nécessaires.


### 3. Configurer les variables d’environnement

Créer un fichier nommé .env à la racine du projet.
Ajouter dedans :
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=VOTRE_CLE_CLERK
```

Remplacer VOTRE_CLE_CLERK par votre vraie clé publique Clerk.


### 4. Lancer le projet

Dans le terminal, tapez :
```bash
npx expo start --clear
```

Expo démarre alors le projet et ouvre un QR code dans le terminal.


### 5. Ouvrir l’application

Ensuite, plusieurs possibilités :

#### Sur téléphone
- installer l’application **Expo Go**
- scanner le QR code affiché dans le terminal ou le navigateur

#### Sur Android
- lancer un émulateur Android
- puis appuyer sur `a` dans le terminal

#### Sur iPhone / iPad
- utiliser l’application **Expo Go** sur un appareil réel
- ou un simulateur iOS sur Mac

---

## CONFIGURATION IMPORTANTE

### Authentification
L’authentification est gérée avec **Clerk**.

Sans clé Clerk valide, la connexion et l’inscription ne fonctionneront pas.

### Aliments et nutrition
Les recherches d’aliments et les scans utilisent **Open Food Facts**.

Une connexion internet est donc nécessaire pour :

- rechercher un aliment
- récupérer les informations d’un produit scanné

### Stockage local
Les repas et les paramètres utilisateur sont enregistrés localement avec **SQLite**.

Ils restent disponibles après la fermeture de l’application.
