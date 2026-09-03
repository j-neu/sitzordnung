export type Language = 'en' | 'de';

export const TRANSLATIONS = {
  en: {
    appTitle: "Seating-Chart Generator",
    saveLayout: "Save Layout",
    loadLayout: "Load Layout",
    exportImage: "Export as Image",
    saveModal: {
      title: "Save Layout",
      description: "Choose what you want to include in this save file.",
      fullLayout: "Full Layout",
      fullLayoutDesc: "Furniture + Students",
      furnitureOnly: "Furniture Only",
      furnitureOnlyDesc: "Room Template",
      cancel: "Cancel"
    },
    tabs: {
      furniture: "Furniture",
      students: "Students",
      relations: "Relations",
      optimize: "Auto-Fill"
    },
    furniture: {
      dimensions: "Dimensions",
      width: "WIDTH",
      height: "HEIGHT",
      library: "Library",
      layouts: "Quick Layouts (24 Students)",
      layoutItems: {
        'grid-single': "Grid (Single)",
        'grid-double': "Grid (Double)",
        'u-shape': "U-Shape",
        'islands-6': "Islands (Groups of 6)"
      },
      items: {
        'table-single': "Single Desk",
        'table-double': "Double Desk",
        'teacher-desk': "Teacher's Desk",
        'whiteboard': "Whiteboard",
        'door': "Door",
        'window': "Window"
      }
    },
    students: {
      searchPlaceholder: "Search students...",
      addPlaceholder: "Add new student...",
      importButton: "Bulk Import",
      importTitle: "Bulk Import",
      importPlaceholder: "Paste student names here (one per line)...",
      importAction: "Import Students",
      cancel: "Cancel",
      randomFill: "Random Fill",
      unassignedTitle: "Unassigned Students",
      allAssigned: "All students assigned!",
      zoneRow: "Row",
      noPreference: "No preference",
      placementHint: "Tap a student to select them, then tap an empty seat on the map to place them there."
    },
    relations: {
      title: "Relationship Tools",
      view: "View",
      define: "Define",
      like: "Like",
      dislike: "Dislike",
      searchPlaceholder: "Filter students...",
      instructions: {
        none: "Select a tool to start marking relationships.",
        selectFirst: "Tap first student...",
        selectSecond: "Now tap the second student!"
      },
      existingLinks: "Existing Links",
      popup: {
        title: "Define Relationship",
        workWell: "Work Well",
        keepApart: "Keep Apart",
        cancel: "Cancel"
      }
    },
    optimize: {
      title: "Auto-Arrange",
      optimizing: "Optimizing...",
      complete: "Optimization Complete",
      description: "Use our smart algorithm to automatically seat students based on their preferences and constraints.",
      descriptionOptimizing: "Finding the best seating arrangement based on your constraints.",
      start: "Start Smart Optimization",
      stop: "Stop & Keep Result",
      runAgain: "Run Again",
      stats: {
        iteration: "ITERATION",
        cost: "COST (LOWER IS BETTER)",
        moved: "Students Moved",
        iterations: "Iterations",
        reduction: "Cost Reduction"
      }
    },
    canvas: {
      desk: "DESK",
      locked: "Locked",
      open: "Open",
      context: {
        unassign: "Unassign",
        rotate: "Rotate 90°",
        lock: "Lock Furniture",
        unlock: "Unlock Furniture",
        delete: "Delete Furniture"
      }
    }
  },
  de: {
    appTitle: "Sitzordnung-Generator",
    saveLayout: "Layout speichern",
    loadLayout: "Layout laden",
    exportImage: "Als Bild exportieren",
    saveModal: {
      title: "Layout speichern",
      description: "Wähle, was im Speicherstand enthalten sein soll.",
      fullLayout: "Komplettes Layout",
      fullLayoutDesc: "Möbel + Schüler",
      furnitureOnly: "Nur Möbel",
      furnitureOnlyDesc: "Raumvorlage",
      cancel: "Abbrechen"
    },
    tabs: {
      furniture: "Möbel",
      students: "Schüler",
      relations: "Beziehungen",
      optimize: "Optimierung"
    },
    furniture: {
      dimensions: "Abmessungen",
      width: "BREITE",
      height: "HÖHE",
      library: "Bibliothek",
      layouts: "Schnell-Layouts (24 Schüler)",
      layoutItems: {
        'grid-single': "Raster (Einzel)",
        'grid-double': "Raster (Doppel)",
        'u-shape': "U-Form",
        'islands-6': "Inseln (6er Gruppen)"
      },
      items: {
        'table-single': "Einzeltisch",
        'table-double': "Doppeltisch",
        'teacher-desk': "Lehrertisch",
        'whiteboard': "Tafel",
        'door': "Tür",
        'window': "Fenster"
      }
    },
    students: {
      searchPlaceholder: "Schüler suchen...",
      addPlaceholder: "Neuer Schüler...",
      importButton: "Importieren",
      importTitle: "Massenimport",
      importPlaceholder: "Namen hier einfügen (einer pro Zeile)...",
      importAction: "Schüler importieren",
      cancel: "Abbrechen",
      randomFill: "Zufällig füllen",
      unassignedTitle: "Nicht zugewiesen",
      allAssigned: "Alle Schüler platziert!",
      zoneRow: "Reihe",
      noPreference: "Keine Präferenz",
      placementHint: "Tippen Sie auf einen Schüler, um ihn auszuwählen, und tippen Sie dann auf einen freien Platz im Raum, um ihn dort zu platzieren."
    },
    relations: {
      title: "Beziehungs-Werkzeuge",
      view: "Ansicht",
      define: "Definieren",
      like: "Gut",
      dislike: "Schlecht",
      searchPlaceholder: "Schüler filtern...",
      instructions: {
        none: "Wähle ein Werkzeug, um Beziehungen zu markieren.",
        selectFirst: "Wähle den ersten Schüler...",
        selectSecond: "Jetzt den zweiten Schüler!"
      },
      existingLinks: "Vorhandene Links",
      popup: {
        title: "Beziehung definieren",
        workWell: "Arbeiten gut",
        keepApart: "Trennen",
        cancel: "Abbrechen"
      }
    },
    optimize: {
      title: "Automatisch Anordnen",
      optimizing: "Optimiere...",
      complete: "Optimierung abgeschlossen",
      description: "Nutze unseren smarten Algorithmus, um Schüler basierend auf Präferenzen automatisch zu platzieren.",
      descriptionOptimizing: "Finde die beste Sitzordnung basierend auf deinen Einschränkungen.",
      start: "Optimierung starten",
      stop: "Stopp & Behalten",
      runAgain: "Nochmal starten",
      stats: {
        iteration: "ITERATION",
        cost: "KOSTEN (NIEDRIGER IST BESSER)",
        moved: "Schüler bewegt",
        iterations: "Iterationen",
        reduction: "Verbesserung"
      }
    },
    canvas: {
      desk: "TISCH",
      locked: "Gesperrt",
      open: "Frei",
      context: {
        unassign: "Zuweisung aufheben",
        rotate: "Drehen 90°",
        lock: "Möbel sperren",
        unlock: "Möbel entsperren",
        delete: "Möbel löschen"
      }
    }
  }
};
