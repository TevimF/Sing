# Guia SDD (Schema-Driven Development) - SingApp

## Principio Central
Os schemas Zod em `src/contracts/` sao a **unica fonte de verdade**. Tipos TypeScript sao inferidos dos schemas, nunca definidos manualmente.

## Workflow

```
1. Definir schema Zod no contrato apropriado
2. Exportar tipo via z.infer<typeof Schema>
3. Escrever teste usando o tipo exportado
4. Implementar funcao que consome/produz o tipo
5. Validar com .parse() nas fronteiras do sistema
```

## Onde Validar (Runtime)

| Fronteira | Validar? | Exemplo |
|-----------|----------|---------|
| Audio input (mic) | SIM | `PitchResultSchema.parse(rawResult)` |
| User input (UI) | SIM | `AudioConfigSchema.parse(userConfig)` |
| Entre modulos core | NAO | Confie no TypeScript |
| Store updates | NAO | Tipos garantem shape |
| API externa (futuro) | SIM | Sempre validar dados externos |

## Evoluindo Schemas

### Adicionando campo opcional (safe)
```typescript
// Antes
export const NoteSchema = z.object({ name: NoteNameSchema, octave: z.number() })

// Depois - backward compatible
export const NoteSchema = z.object({ name: NoteNameSchema, octave: z.number(), alias: z.string().optional() })
```

### Mudando campo existente (breaking)
1. Atualize o schema
2. `npm run test:run` - veja TODOS os testes que quebram
3. Corrija cada teste e implementacao
4. Nunca commite com testes quebrados

## Contratos como Documentacao

Cada schema serve como documentacao viva:
- O schema define a **forma** dos dados
- Os defaults definem os **valores padrao**
- Os validators (min, max, positive) definem as **regras de negocio**
- Os testes validam o **comportamento**

## Anti-Patterns

- **Duplicar tipos**: `interface Note { ... }` quando ja existe `NoteSchema` -> Use `z.infer`
- **Validar demais**: `.parse()` em toda chamada interna -> Valide apenas nas fronteiras
- **Schemas enormes**: Um schema com 20+ campos -> Componha schemas menores
- **Ignorar defaults**: Definir defaults no codigo ao inves do schema -> Centralize no Zod
