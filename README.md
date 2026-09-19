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

Engine v `src/engine.ts` používa mesačný krok. V poradí započítava rast aktív, príjmy, prevádzku, dlhovú službu, výnos portfólia a doplnenie alebo čerpanie rezervy. Istina znižuje dlh; rast ceny nehnuteľnosti nie je hotovostný príjem. DPS je súčasťou čistého imania, ale predvolene nie je dostupná na financovanie ani FIRE.

## Známe limity

- Výsledky sú pred neznámymi daňami z nájmu a investícií.
- Rent-roll, CAPEX a presné právne usporiadanie budovy treba doplniť.
- Beroun nemá potvrdenú splatnosť ani refixáciu.
- Dom, partnerkin vklad a úverové ponuky sú modelové predpoklady.
- Deterministický model nie je finančné, právne ani daňové poradenstvo.
