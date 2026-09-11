Add-Type -AssemblyName System.Speech
$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speech.SelectVoice('Microsoft Sabina Desktop')
$speech.Rate = -2
$items = Get-Content -LiteralPath 'scripts/audio-scripts.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$audioDir = Join-Path (Get-Location) 'public/audio'
New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
foreach ($item in $items) {
  $target = Join-Path $audioDir ($item.id + '.wav')
  $speech.SetOutputToWaveFile($target)
  $builder = New-Object System.Speech.Synthesis.PromptBuilder
  $builder.StartVoice('Microsoft Sabina Desktop')
  $builder.AppendText('Encuentra una postura cómoda. Puedes mantener los ojos abiertos o cerrarlos, como prefieras.')
  $builder.AppendBreak([TimeSpan]::FromSeconds(3))
  $builder.AppendText($item.prompt)
  $builder.AppendBreak([TimeSpan]::FromSeconds(5))
  $builder.AppendText('No necesitas cambiar nada. Solo observa. Si tu atención se aleja, regresa con amabilidad.')
  $builder.AppendBreak([TimeSpan]::FromSeconds(5))
  $builder.AppendText('Toma el tiempo que necesites. Para terminar, nota el contacto de tu cuerpo con el lugar donde estás. Gracias por dedicarte esta pausa.')
  $builder.EndVoice()
  $speech.Speak($builder)
  $speech.SetOutputToNull()
}
$speech.Dispose()
Write-Output ('Generated ' + $items.Count + ' Spanish sample audio files.')
