# Referencia de Teoria Musical - SingApp

## Temperamento Igual (12-TET)

Formula base: `f = refPitch * 2^((midi - 69) / 12)`

Onde:
- `refPitch` = 440 Hz (A4 padrao)
- `midi` = numero MIDI da nota (A4 = 69)

## Tabela de Frequencias (A4 = 440Hz)

| Nota | MIDI | Frequencia (Hz) |
|------|------|-----------------|
| C2   | 36   | 65.41           |
| C3   | 48   | 130.81          |
| A3   | 57   | 220.00          |
| C4   | 60   | 261.63          |
| E4   | 64   | 329.63          |
| G4   | 67   | 392.00          |
| A4   | 69   | 440.00          |
| C5   | 72   | 523.25          |
| A5   | 81   | 880.00          |
| C6   | 84   | 1046.50         |

## Cents

1 semitom = 100 cents
1 oitava = 1200 cents

Formula: `cents = 1200 * log2(f2 / f1)`

## Intervalos e Semitons

| Intervalo | Semitons | Razao (just) | Exemplo (de C) |
|-----------|----------|-------------|-----------------|
| Unissono | 0 | 1:1 | C -> C |
| 2a menor | 1 | 16:15 | C -> Db |
| 2a maior | 2 | 9:8 | C -> D |
| 3a menor | 3 | 6:5 | C -> Eb |
| 3a maior | 4 | 5:4 | C -> E |
| 4a justa | 5 | 4:3 | C -> F |
| Tritono | 6 | 45:32 | C -> F# |
| 5a justa | 7 | 3:2 | C -> G |
| 6a menor | 8 | 8:5 | C -> Ab |
| 6a maior | 9 | 5:3 | C -> A |
| 7a menor | 10 | 16:9 | C -> Bb |
| 7a maior | 11 | 15:8 | C -> B |
| Oitava | 12 | 2:1 | C -> C |

## Extensao Vocal Tipica

| Classificacao | Faixa | MIDI |
|--------------|-------|------|
| Baixo | E2 - E4 | 40-64 |
| Baritono | A2 - A4 | 45-69 |
| Tenor | C3 - C5 | 48-72 |
| Contralto | F3 - F5 | 53-77 |
| Mezzo-soprano | A3 - A5 | 57-81 |
| Soprano | C4 - C6 | 60-84 |

## Exercicios de Intervalos

O fluxo basico de um exercicio:
1. App toca/mostra a nota raiz (ex: C4)
2. Usuario canta a nota raiz (afinacao)
3. App mostra a nota alvo (ex: E4 para terca maior)
4. Usuario canta a nota alvo
5. App mede o desvio em cents e da feedback

### Exercicios Sugeridos para Iniciantes
1. **Unissono** - Manter a mesma nota (treinar afinacao pura)
2. **Terca maior** - 4 semitons acima (intervalo alegre, natural)
3. **Quinta justa** - 7 semitons acima (intervalo mais consonante)
4. **Oitava** - 12 semitons acima (dobro da frequencia)
