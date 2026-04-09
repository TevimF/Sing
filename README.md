# Sing

Treinador vocal em tempo real no navegador. Detecta o pitch da sua voz pelo microfone e guia voce por exercicios de intervalos musicais.

## Como usar

### 1. Abrir o app

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador (Chrome recomendado).

### 2. Ativar o microfone

Clique em **Iniciar Microfone** e permita o acesso. Voce vera o nivel de entrada em dB ao lado do botao.

### 3. Verificar o grafico

O grafico mostra seu pitch em tempo real. O piano a esquerda indica as notas. O marcador verde no centro e sua voz. Se nao aparecer nada, ajuste os filtros de audio no painel da direita.

### 4. Configurar exercicios

No painel esquerdo:
- **Tom**: escolha a nota raiz (C, D, E...)
- **Oitava**: use +/- para transpor. Vozes masculinas normalmente ficam na oitava 3, femininas na 4
- **Intervalos**: selecione quais intervalos praticar (unissono, tercas, quintas, oitava, vibrato)

Clique em **Iniciar Exercicios**.

### 5. Praticar

Cada exercicio mostra a nota raiz e a nota alvo. Clique nas notas para ouvir o tom de referencia.

Cante a nota alvo e **segure** - uma barra de progresso aparece quando voce acerta. Mantenha a afinacao por 1.5 segundos para completar automaticamente. Se quiser pular, clique em **Pular**.

### 6. Vibrato

O exercicio de vibrato pede que voce oscile a voz em torno da nota raiz. O app detecta se voce esta fazendo vibrato real (oscilacao ritmica de pelo menos 30 cents).

## Filtros de audio

Se o app nao detecta sua voz bem, expanda **Filtros de Audio** no painel direito:

- **Noise Gate**: corta som abaixo de um limiar (util em ambientes barulhentos)
- **High-pass**: remove graves/ruido de fundo
- **Low-pass**: remove agudos/ruido eletrico
- **Compressor**: nivela o volume da entrada

## Sensibilidade

O slider de sensibilidade controla o "clarity threshold" da detecao de pitch. Valores mais baixos detectam mais facilmente mas podem gerar falsos positivos. O padrao (80%) funciona bem para a maioria dos casos.

## Stack tecnica

- React 18 + TypeScript + Vite
- Web Audio API + AudioWorklet para processamento em tempo real
- pitchy (McLeod Pitch Method) para detecao de pitch
- Zustand para state management
- Zod para validacao de contratos (SDD)
- Canvas API para visualizacao do grafico de pitch

## Desenvolvimento

```bash
npm run test        # testes unitarios (vitest)
npm run test:run    # testes sem watch
npm run build       # build de producao
```

## Licenca

MIT
