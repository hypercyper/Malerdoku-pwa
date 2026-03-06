# MalerDoku – Baustellendokumentation PWA

Progressive Web App für Malerbetriebe zur Dokumentation von Baustellenbegehungen.

## Features

- **Projekte verwalten** – Kundenname, Adresse, Projektnummer, Ansprechpartner
- **Räume definieren** – Beliebig viele Räume pro Projekt
- **Fotos aufnehmen** – Direkt mit der Handy-Kamera oder aus der Galerie
- **Foto-Editor** – Auf Fotos zeichnen (Stift, Pfeile, Text) um Stellen zu markieren
- **Fazit schreiben** – Gesamteinschätzung am Ende
- **PDF-Bericht** – Druckbarer Bericht mit allen Daten und Fotos
- **Offline-fähig** – Funktioniert auch ohne Internet
- **Installierbar** – Erscheint als App auf dem Homescreen

## Schnellstart: Deployment auf Vercel (kostenlos)

### 1. Voraussetzungen
- Ein GitHub-Account (kostenlos: https://github.com)
- Ein Vercel-Account (kostenlos: https://vercel.com – mit GitHub anmelden)

### 2. Projekt auf GitHub hochladen

```bash
# Git initialisieren
cd malerdoku-pwa
git init
git add .
git commit -m "MalerDoku PWA initial"

# Neues GitHub Repository erstellen (auf github.com)
# Dann verbinden:
git remote add origin https://github.com/DEIN-USERNAME/malerdoku-pwa.git
git push -u origin main
```

### 3. Auf Vercel deployen

1. Gehe zu https://vercel.com/new
2. Wähle dein GitHub Repository "malerdoku-pwa"
3. Vercel erkennt automatisch Vite – klicke einfach **"Deploy"**
4. Nach ca. 1 Minute bekommst du eine URL wie `malerdoku-pwa.vercel.app`

### 4. App auf dem Handy installieren

1. Öffne die Vercel-URL auf deinem Android-Handy im Chrome
2. Chrome zeigt automatisch ein Banner **"Zum Startbildschirm hinzufügen"**
3. Falls nicht: Tippe auf die drei Punkte (⋮) → "App installieren" oder "Zum Startbildschirm"
4. Die App erscheint jetzt als Icon auf deinem Homescreen!

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Öffne http://localhost:5173 im Browser.

## Build

```bash
npm run build
```

Die fertigen Dateien liegen dann in `dist/`.

## Projektstruktur

```
malerdoku-pwa/
├── public/
│   ├── icon-192.png      # App-Icon 192x192
│   └── icon-512.png      # App-Icon 512x512
├── src/
│   ├── main.jsx          # React Entry Point
│   ├── App.jsx           # Komplette App (alle Screens)
│   └── storage.js        # IndexedDB Datenspeicherung
├── index.html            # HTML mit PWA Meta-Tags
├── vite.config.js        # Vite + PWA Plugin Config
└── package.json
```

## Hinweise

- **Datenspeicherung**: Alle Daten (Projekte, Fotos) werden lokal in IndexedDB gespeichert. Sie bleiben auch nach Browser-Neustart erhalten.
- **Fotos**: Werden automatisch auf max. 1200px Breite komprimiert um Speicherplatz zu sparen.
- **PDF**: Der Bericht wird als druckbare Seite angezeigt. Über "Drucken" → "Als PDF speichern" wird eine PDF erstellt.
- **Updates**: Bei Vercel-Deployment werden Updates automatisch an alle Nutzer verteilt.
