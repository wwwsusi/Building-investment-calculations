# Sloboda — finančný kompas

Interaktívna slovenská aplikácia na porovnanie ôsmich finančných a životných variantov. Obsahuje FIRE model, stresové testy, detailné financovanie variantov a samostatnú kalkulačku nákupu a prevádzky komerčnej nehnuteľnosti. Výpočty bežia lokálne v prehliadači a používateľské vstupy sa ukladajú iba do `localStorage`.

## Spustenie

```bash
pnpm install
pnpm dev
```

Produkčné zostavenie a testy:

```bash
pnpm test
pnpm build
```

Hotové statické súbory sa po zostavení nachádzajú v priečinku `dist/`.

## Realitná kalkulačka

Podstránka `/calculator` počíta základnú anuitnú splátku, dynamický rent-roll jednotlivých nájomníkov, NOI, cash flow, cap rate, cash-on-cash ROI, DSCR, debt yield, bod zvratu obsadenosti, splácanie istiny a orientačné investičné zdravie projektu.

## Metodika

Engine v `src/engine.ts` používa úvodný stav v mesiaci 0 a potom presne jeden tok za každý modelovaný mesiac. V poradí započítava rast aktív, prípadnú kúpu domu, príjmy, prevádzku, dlhovú službu, výnos portfólia a doplnenie alebo čerpanie rezervy. Istina znižuje dlh; pri splátke nižšej než úrok sa nezaplatený úrok pripočíta k dlhu. Rast ceny nehnuteľnosti nie je hotovostný príjem.

Veľké transakcie sú atomické: predaj zaťažený vyšším dlhom, kúpa budovy, rodinného bytu alebo domu sa uskutočnia iba vtedy, keď sú kryté všetky potrebné vlastné zdroje. Inak sa aktívum, súvisiaci úver ani príjem do projekcie nepridajú a výsledok zobrazí deficit. FIRE mesiac je prvý mesiac, od ktorého zostáva pokrytie aspoň 100 % až do konca horizontu bez platobného deficitu.

DPS je vždy súčasťou čistého imania. Jeho výnos má samostatný vstup a do financovania aj FIRE portfólia sa započíta iba po zapnutí dostupnosti DPS. Stresový test jednorazovo zníži portfólio pri presune a počas nasledujúcich 12 mesiacov znižuje mzdu a príjem budovy; aktívny stres je viditeľne označený na každej stránke.

## Známe limity

- Výsledky sú pred neznámymi daňami z nájmu a investícií.
- Rent-roll, CAPEX a presné právne usporiadanie budovy treba doplniť.
- Beroun nemá potvrdenú splatnosť ani refixáciu.
- Dom, partnerkin vklad a úverové ponuky sú modelové predpoklady.
- Prahové hodnoty investičného zdravia sú interný orientačný filter; nie sú univerzálnou bankovou normou.
- Deterministický model nie je finančné, právne ani daňové poradenstvo.
