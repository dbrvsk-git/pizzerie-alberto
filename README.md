# Pizzerie Alberto

Web italské pizzerie s jídelním lístkem, online rezervací stolu a administrací.
Full-stack aplikace v Next.js nasazená na Vercelu, data v Postgresu (Neon).

## Funkce

**Pro hosty**

- jídelní lístek po kategoriích (pizzy, těstoviny, předkrmy, nápoje)
- rezervace stolu ve 3 krocích: termín → výběr stolu na plánku → kontaktní údaje
- obsazené a blokované stoly nejdou vybrat, pro 1–2 osoby se nabízí nejdřív malé stoly
- potvrzení rezervace odkazem z e-mailu (platí 30 minut), zrušení odkazem kdykoli před začátkem

**Administrace** (`/admin`)

- přehled dne: plánek stolů v zadaný čas a časová osa všech rezervací
- seznam rezervací s filtrem a vyhledáváním, export do CSV
- ruční zadání rezervace (telefonické), úprava, zrušení, smazání
- blokace stolů nebo celé restaurace (např. uzavřená společnost)
- správa jídelního lístku včetně řazení přetažením a skrývání položek

## Technologie

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4,
Postgres (Neon), Nodemailer, JWT session (jose), bcrypt.

Kolize rezervací hlídá přímo databáze (exclusion constraint nad `tsrange`),
takže stejný stůl nejde zarezervovat dvakrát ani při současném odeslání.

## Lokální spuštění

```bash
npm install
npm run dev
```

Bez `DATABASE_URL` se použije vestavěný Postgres (PGlite) ve složce `.pglite`
a e-maily se jen vypisují do konzole. Administrátora vytvoříte na `/admin/setup`.

## Nasazení na Vercel

1. Importovat repozitář, ve **Storage** přidat databázi **Neon** (nastaví `DATABASE_URL`).
2. Nastavit proměnné prostředí podle `.env.example`.
3. Při buildu se automaticky vytvoří tabulky a naplní jídelní lístek (`scripts/db-setup.mjs`).
4. Na `/admin/setup` vytvořit administrátora pomocí `SETUP_KEY`.
