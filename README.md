# H2 Detailing – Finanční přehled

Interní webová aplikace pro správu zakázek, nákladů a klientů detailingové dílny H2.

## Spuštění (lokálně)

### Požadavky
- Node.js v22 nebo novější

### První spuštění

```bash
# 1. Nainstaluj závislosti
npm install
cd backend && npm install && cd ..

# 2. Spusť obě části najednou
npm run dev
```

Aplikace bude dostupná na:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Přihlašovací údaje (výchozí)
| Uživatel | Heslo       |
|----------|-------------|
| jirka    | jirka123    |
| patrik   | patrik123   |

Hesla lze změnit v sekci **Nastavení** po přihlášení.

---

## Přístup z jiného zařízení (stejná síť)

1. Zjisti svoji lokální IP adresu (např. `192.168.1.100`):
   ```
   ipconfig getifaddr en0
   ```

2. Ve `vite.config.js` přidej do `server`:
   ```js
   server: {
     host: '0.0.0.0',
     proxy: { ... }
   }
   ```

3. Z jiného zařízení otevři: `http://192.168.1.100:5173`

---

## Produkční nasazení (VPS / Railway / Render)

```bash
# Zkompiluj frontend
npm run build

# Spusť backend (servíruje i frontend)
cd backend && NODE_ENV=production node server.js
```

Backend na portu 3001 bude servírovat jak API, tak zkompilovaný frontend.
Nastav proměnnou `PORT` pro jiný port a `JWT_SECRET` pro produkci.

---

## Struktura projektu

```
h2-detailing/
├── src/                  # React frontend
│   ├── components/       # UI komponenty
│   ├── api/index.js      # API klient
│   └── App.jsx           # Hlavní komponenta
├── backend/
│   ├── routes/           # Express routes
│   ├── middleware/auth.js # JWT auth
│   ├── database.js       # SQLite (node:sqlite)
│   └── server.js         # Express server
└── backend/data/h2.db    # SQLite databáze (auto-vytvořena)
```

## Funkce

- 🔐 Přihlášení (Jirka / Patrik)
- 📊 Dashboard s měsíčním přehledem a vyrovnáváním nákladů
- 📋 Zakázky: klient, vozidlo, cena ze služeb, kdo pracoval, čas, stav, fotky
- 💰 Náklady: kategorie, kdo zaplatil
- 👥 Klienti: vozidla, historie zakázek (CRM)
- 📈 Historie transakcí s CSV exportem
- ⚙️ Nastavení: dělení zisku, paušál dílny, změna hesla
