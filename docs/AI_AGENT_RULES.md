# Regras para Agentes IA

## Principios Fundamentais

1. **Schema-First**: Sempre escreva/atualize o schema Zod ANTES da implementacao
2. **Teste-First**: Escreva o teste que falha ANTES de implementar a funcao
3. **Contratos sao lei**: Nunca duplique manualmente um schema Zod como interface TypeScript. Use `z.infer<>`
4. **Pureza no core**: Toda funcao em `src/core/` deve ser pura (sem side effects), exceto `audio-manager.ts`

## Regras de Codigo

### Estrutura
- Testes ficam em `__tests__/` co-localizados com o modulo, NAO em diretorio top-level
- Imports de contratos sempre via `@/contracts` (barrel export)
- AudioWorklet nao pode importar de outros modulos (roda em escopo separado)

### Validacao
- Todos os valores de pitch DEVEM passar por `PitchResultSchema.parse()` antes de chegar na UI
- Validacao runtime nas fronteiras do sistema (audio input, user input)
- Confie no TypeScript para validacao interna entre modulos

### Estilo
- Preferir composicao sobre heranca
- CSS Modules ou CSS puro - CSS-in-JS proibido
- Funcoes pequenas e focadas (max ~30 linhas)
- Nomes descritivos - sem abreviacoes obscuras

### Testes
- Nomenclatura: `should [comportamento esperado] when [condicao]`
- Use buffers sinteticos (sine waves) para testar pitch detection
- Mock Web Audio API com classes stub
- Stores Zustand testados fora do React

## Workflow de Desenvolvimento

```
1. Ler/criar contrato Zod
2. Escrever teste que falha (RED)
3. Implementar minimo para passar (GREEN)
4. Refatorar mantendo testes verdes (REFACTOR)
5. Repetir
```

## O Que NAO Fazer

- NAO adicionar features alem do escopo pedido
- NAO criar abstracoes especulativas para "uso futuro"
- NAO modificar contratos existentes sem atualizar TODOS os testes afetados
- NAO commitar com testes falhando
- NAO usar `any` - se o tipo e desconhecido, defina um schema
- NAO adicionar dependencias sem justificativa documentada
