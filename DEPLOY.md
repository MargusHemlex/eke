# Juhised: GitHub push ja Vercel deploy

## 1. Lokaalne seadistamine

```bash
cd eesti-keel-eksam

# Sõltuvuste installimine
npm install

# Loo .env.local ja lisa API võti
cp .env.local.example .env.local
# Muuda .env.local ja lisa oma ANTHROPIC_API_KEY

# Käivita arendusserver
npm run dev
# → http://localhost:3000
```

---

## 2. GitHub — loo repo ja lükka kood üles

```bash
# Initsialiseerita Git
git init
git add .
git commit -m "feat: EKI õigekirja abivahend — esialgne versioon"

# Loo GitHub-is uus repo (näiteks: eesti-keel-eksam)
# Seejärel:
git remote add origin https://github.com/SINU-KASUTAJANIMI/eesti-keel-eksam.git
git branch -M main
git push -u origin main
```

> **Tähelepanu:** Ära iial lisa `.env.local` Giti! See sisaldab salajast API võtit. `.gitignore` kaitseb sind, aga ole tähelepanelik.

---

## 3. Vercel deploy

### A) Vercel CLI kaudu (soovituslik)

```bash
# Installi Vercel CLI (kui pole)
npm i -g vercel

# Deploy
vercel

# Järgi juhiseid:
# - Link to existing project? No
# - Project name: eesti-keel-eksam
# - Directory: ./
# - Override settings? No
```

### B) Vercel veebiportaali kaudu

1. Mine [vercel.com](https://vercel.com) → **Add New Project**
2. Impordi GitHub repo (`eesti-keel-eksam`)
3. Framework: **Next.js** (tuvastab automaatselt)
4. **Environment Variables** sektsioonis lisa:
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (sinu tegelik võti)
5. Klõpsa **Deploy**

---

## 4. Keskkonnamuutujad Verceli seadetes

Verceli dashboardis: **Project Settings → Environment Variables**

| Muutuja | Väärtus | Keskkond |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxxxx` | Production, Preview, Development |

> Pärast muutuja lisamist tee uus deploy: `vercel --prod`

---

## 5. Kontroll pärast deployt

```bash
# Kontrolli production buildi lokaalselt enne deployt
npm run build
npm run start
# → http://localhost:3000

# Kontrolli Vercel logisid
vercel logs
```

---

## 6. Domeen (valikuline)

Verceli dashboardis: **Project → Domains → Add Domain**

Näiteks: `oigekiri.ee` (kui domeen on sinu käes)

---

## Kiire kontroll-nimekiri

- [ ] `.env.local` on loodud ja sisaldab `ANTHROPIC_API_KEY`
- [ ] `.env.local` on `.gitignore`-is (on!)
- [ ] `npm run build` õnnestub vigadeta
- [ ] `/api/correct` tagastab vastuse
- [ ] `/docs` laeb EKI reeglite lehe
- [ ] Vercel Environment Variables on seadistatud
