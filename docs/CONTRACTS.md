# Contratos - SingApp

## Localizacao
Todos os schemas vivem em `src/contracts/`. Este documento serve como referencia rapida.

## Audio (`audio.contracts.ts`)

### AudioConfig
Configuracao do pipeline de audio.
- `sampleRate`: number (default: 44100) - Taxa de amostragem
- `bufferSize`: number (default: 2048) - Tamanho do buffer (potencias de 2)
- `clarityThreshold`: number 0-1 (default: 0.9) - Limiar de confianca do pitch
- `referencePitch`: number (default: 440) - Frequencia do A4 em Hz

### PitchResult
Resultado de uma deteccao de pitch.
- `frequency`: number >= 0 - Frequencia detectada em Hz (0 = sem pitch)
- `clarity`: number 0-1 - Confianca da deteccao
- `timestamp`: number - performance.now()
- `midiNote`: number 0-127 | null - Nota MIDI mais proxima
- `noteName`: string | null - Nome da nota (ex: "A4", "C#3")
- `centsOffset`: number | null - Desvio em cents da nota mais proxima (-50 a +50)

### AudioState
Estado do sistema de audio.
- `isListening`: boolean - Microfone ativo
- `hasPermission`: boolean | null - Permissao concedida (null = nao solicitada)
- `currentPitch`: PitchResult | null - Ultimo pitch detectado
- `error`: string | null - Mensagem de erro

## Musica (`music.contracts.ts`)

### NoteName
Enum: C, C#, D, D#, E, F, F#, G, G#, A, A#, B

### Note
Uma nota musical com posicao absoluta.
- `name`: NoteName
- `octave`: number 0-8
- `frequency`: number > 0
- `midi`: number 0-127

### IntervalType
Enum: unison, minor_second, major_second, minor_third, major_third, perfect_fourth, tritone, perfect_fifth, minor_sixth, major_sixth, minor_seventh, major_seventh, octave

### Exercise
Um exercicio individual de intervalo.
- `id`: string
- `intervalType`: IntervalType
- `rootNote`: Note - Nota de partida
- `targetNote`: Note - Nota alvo
- `toleranceCents`: number (default: 10) - Margem de erro aceitavel
- `status`: pending | active | completed | skipped
- `bestCentsOffset`: number | null - Melhor resultado do usuario
- `holdDurationMs`: number (default: 1000) - Tempo para segurar a nota

### ExerciseSet
Conjunto de exercicios para uma sessao.
- `id`: string
- `name`: string
- `key`: NoteName - Tom selecionado
- `intervals`: IntervalType[] - Intervalos a praticar
- `exercises`: Exercise[]
- `currentIndex`: number - Exercicio atual

## UI (`ui.contracts.ts`)

### TunerDisplay
Estado calculado para o componente do afinador.
- `needleAngle`: number -90 a 90 - Angulo da agulha
- `noteLabel`: string - "A4" ou "--"
- `centsLabel`: string - "+5", "-12", ou "--"
- `isInTune`: boolean - Dentro da tolerancia
- `frequencyLabel`: string - "440.0 Hz"
- `clarityPercent`: number 0-100

### PitchHistoryPoint
Ponto no grafico de historico.
- `timestamp`: number
- `centsOffset`: number | null
- `targetCents`: number (sempre 0 = linha central)
