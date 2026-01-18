# Focus Dashboard — PRD v1

## 1. Contexte
Je veux une petite application / interface qui me permet de choisir rapidement une méthode de travail
(selon mon énergie, mon envie ou le type de tâche) et de la respecter sans réfléchir.

Le problème actuel :
- dispersion mentale
- changement fréquent de tâches
- difficulté à respecter les règles de focus
- besoin d’un cadre clair (timer + règles + tâche visible)

---

## 2. Objectifs
- Choisir une méthode en moins de 5 secondes
- Lancer une session de travail immédiatement
- Respecter les règles propres à chaque méthode
- Rester concentré sur la bonne chose (1 tâche ou une liste)
- Visualiser ce que j’ai fait à la fin de la session

---

## 3. Méthodes de travail retenues
Méthodes incluses dans la V1 :
1. Deep Work pur
2. Deep Work light
3. Pomodoro
4. 90 / 20

---

## 4. Détail des méthodes

### 4.1 Deep Work pur
**Objectif**  
Travail cognitif intense sur une tâche importante nécessitant une immersion totale.

**Durées**
- Temps de focus : 2h à 4h
- Pause : 15 à 30 min après la session

**Tâches**
- 1 seule tâche (obligatoire)

**Règles**
- Téléphone hors de portée / mode avion
- Aucune notification
- Aucun mail, message ou onglet parasite
- Toute pensée parasite est notée dans une zone dédiée, sans quitter la tâche

**Types de travail pertinents**
- Stratégie
- Décisions importantes
- Création lourde
- Écriture longue
- Structuration de projet

---

### 4.2 Deep Work light
**Objectif**  
Avancer sérieusement sur un sujet, avec un cadre plus souple que le deep work pur.

**Durées**
- Temps de focus : ~2h
- Pause : 10 à 20 min

**Tâches**
- 1 tâche principale
- Sous-tâches autorisées si elles restent sur le même sujet

**Règles**
- Pas de changement de sujet
- Micro-pauses autorisées
- Moins de rigidité, mais focus maintenu

**Types de travail pertinents**
- Écriture plus légère
- Amélioration / itération
- Recherche structurée
- Préparation de contenu

---

### 4.3 Pomodoro
**Objectif**  
Exécuter efficacement des tâches simples ou lutter contre la procrastination.

**Durées**
- Focus : 25 min
- Pause : 5 min
- Pause longue : 15 à 20 min après 4 cycles

**Tâches**
- Liste de petites tâches (checklist)
- 1 tâche par pomodoro

**Règles**
- Pause = vraie pause (pas de scroll)
- Une interruption est notée puis traitée plus tard
- Respect strict du timer

**Types de travail pertinents**
- Admin
- Mails
- Tâches répétitives
- Journées de faible énergie

---

### 4.4 90 / 20
**Objectif**  
Atteindre un bon niveau de flow tout en respectant les capacités d’attention.

**Durées**
- Focus : 90 min
- Pause : 15 à 20 min

**Tâches**
- 1 tâche par cycle

**Règles**
- Focus sans distraction
- Pause dédiée à la récupération
- Pas d’écran pendant la pause si possible

**Types de travail pertinents**
- Création
- Réflexion
- Production continue
- Alternative au deep work pur

---

## 5. Structure de l’application

### 5.1 Dashboard
Affichage de cartes représentant chaque méthode avec :
- Nom de la méthode
- Phrase objectif (1 ligne)
- Durées focus / pause
- Tags “quand l’utiliser”
- Bouton "Start"
- Bouton "Détails"

---

### 5.2 Vue Session (Timer)
Éléments visibles :
- Timer principal
- Statut (focus / pause)
- Boutons : pause, reprendre, terminer
- Règles clés de la méthode (résumé)
- Zone tâches :
  - Deep Work : 1 champ tâche unique
  - Pomodoro : checklist
- Zone “notes rapides / distractions”

---

### 5.3 Fin de session (Recap)
- Temps total de focus
- Tâche(s) complétée(s)
- Auto-évaluation rapide (focus / énergie)
- Bouton relancer une session

---

### 5.4 Historique
- Temps de focus par jour / semaine
- Répartition par méthode
- Streak de jours actifs

---

### 5.5 Paramètres
- Ajustement des durées par méthode
- Sons / notifications
- Dark mode
- Activation / désactivation des pauses automatiques

---

## 6. Règles UX importantes
- Interface minimaliste
- Une action principale par écran
- Toujours visible :
  - la méthode en cours
  - la tâche active
  - le temps restant

---

## 7. MVP (V1)
- Dashboard
- 4 méthodes
- Timer fonctionnel
- Zone tâche(s)
- Recap de session
- Historique simple

---

## 8. Évolutions possibles (V2)
- Mode focus lock
- Templates de sessions
- Export des stats
- Blocage d’apps/sites
