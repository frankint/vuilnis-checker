# ♻️ Spaarnelanden Afval & Container Checker

Een moderne, 100% standalone webapplicatie die op basis van URL-parameters (`postcode`, `house_number`, en `sRegistrationNumber`) live afvalophaaldatum en containerstatus informatie ophaalt bij Spaarnelanden.

## 🚀 Snelle Start (Geen server nodig!)

### Direct openen in de browser
Dubbelklik op `index.html` of open het bestand direct in je browser met query parameters:

```
file:///C:/pad/naar/vuilnis-checker/index.html?postcode=2023BA&house_number=29&sRegistrationNumber=81167
```

### Optie met de ingebouwde Python Server (Optioneel)
Als je liever een lokale HTTP server gebruikt, voer uit:

```bash
python server.py
```
En open: [http://localhost:8000/?postcode=2023BA&house_number=29&sRegistrationNumber=81167](http://localhost:8000/?postcode=2023BA&house_number=29&sRegistrationNumber=81167)

---

## 📌 URL Parameter Formaat

| Parameter | Beschrijving | Voorbeeld | Alternatieve namen |
|---|---|---|---|
| `postcode` | Postcode van het adres | `2023BA` | `postalcode`, `pc` |
| `house_number` | Huisnummer | `29` | `houseNumber`, `huisnummer`, `hn` |
| `sRegistrationNumber` | Registratienummer van de container | `81167` | `registrationNumber`, `container` |

### Voorbeeld URL:
```
index.html?postcode=2023BA&house_number=29&sRegistrationNumber=81167
```

---

## ✨ Nieuwe & Belangrijkste Functies

1. **100% Serverless & Standalone (CORS Proxy Chain)**:
   - Werkt direct in elke browser wanneer je `index.html` leeg of direct als bestand opent.
   - Schakelt automatisch tussen een reeks snelle CORS-proxies (`proxy.cors.sh`, `allorigins`, `corsproxy.org`) en de optionele `server.py` backend.

2. **💻 Terminal Live Data Stream Windows**:
   - Geïntegreerd CLI terminal venster in macOS/Linux stijl (`spaarnelanden-raw-stream.log`).
   - Simuleert een realtime typende log-stream van alle netwerk-HTTP requests en ruwe JSON attributen.
   - Inclusief knoppen voor **▶ Replay Stream**, **📋 Kopieer Logboek**, en **🧹 Clear**.

3. **Afvalophaal Schema (Afvalwijzer)**:
   - Markeert als eerste de **Groenbak** of **Grijze bak** met geformatteerde Nederlandse datum en relatieve dagen (*"over 12 dagen"*, *"vandaag"*, *"morgen"*).
   - Volledige kalender van alle geplande afvalstromen met pictogrammen.

4. **Container Status Meter (`sRegistrationNumber`)**:
   - Ronde SVG vullingsgraad meter met dynamische kleurcodering (Groen/Oranje/Rood).
   - Status badges voor `bIsEmptiedToday`, `bIsOutOfUse`, `bIsSkipped`.
   - Volledig eigenschappen grid + kaartlocatie link + weekdagenschema (`sDefaultDays`).

---

## 🛠️ Projectstructuur

```
vuilnis-checker/
├── index.html       # Hoofdpagina HTML structure & Terminal venster
├── css/
│   └── styles.css   # Responsive layout, meter & terminal styling
├── js/
│   └── app.js       # Standalone CORS proxy chain, Terminal stream simulator & DOM
├── server.py        # Optionele lokale Python HTTP server & CORS proxy
└── README.md        # Documentatie
```
