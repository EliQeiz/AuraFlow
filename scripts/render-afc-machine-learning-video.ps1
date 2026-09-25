[CmdletBinding()]
param(
  [switch]$KeepWorkFiles
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required. Install it and run this script again."
  }
}

function Escape-Xml([string]$Value) {
  return [System.Security.SecurityElement]::Escape($Value)
}

function To-VttTime([double]$Seconds) {
  $span = [TimeSpan]::FromSeconds($Seconds)
  return ('{0:00}:{1:00}:{2:00}.{3:000}' -f [Math]::Floor($span.TotalHours), $span.Minutes, $span.Seconds, $span.Milliseconds)
}

function From-VttTime([string]$Value) {
  $parts = $Value.Split(':')
  return ([double]$parts[0] * 3600) + ([double]$parts[1] * 60) + [double]::Parse($parts[2], [Globalization.CultureInfo]::InvariantCulture)
}

function Get-WavDuration([string]$Path) {
  $value = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Path
  return [double]::Parse($value, [Globalization.CultureInfo]::InvariantCulture)
}

function New-SceneSvg($Scene, [int]$Index, [string]$Path) {
  $title = Escape-Xml $Scene.Title
  $titleWords = $Scene.Title -split ' '
  $titleLines = @()
  $titleLine = ''
  foreach ($word in $titleWords) {
    $candidate = if ($titleLine) { "$titleLine $word" } else { $word }
    if ($candidate.Length -gt 27 -and $titleLine) {
      $titleLines += $titleLine
      $titleLine = $word
    } else {
      $titleLine = $candidate
    }
  }
  if ($titleLine) { $titleLines += $titleLine }
  $titleSize = if ($titleLines.Count -gt 1) { 50 } else { 62 }
  $titleMarkup = ''
  for ($titleIndex = 0; $titleIndex -lt $titleLines.Count; $titleIndex++) {
    $titleMarkup += "<text x=`"146`" y=`"$([int](377 + ($titleIndex * 64)))`" class=`"sans`" font-size=`"$titleSize`" font-weight=`"700`" fill=`"#102a56`">$(Escape-Xml $titleLines[$titleIndex])</text>"
  }
  $bodyStart = 438 + (($titleLines.Count - 1) * 64)
  $bodyLines = @()
  foreach ($bodySection in ($Scene.Body -split '\|')) {
    $bodyLine = ''
    foreach ($bodyWord in ($bodySection.Trim() -split ' ')) {
      $candidate = if ($bodyLine) { "$bodyLine $bodyWord" } else { $bodyWord }
      if ($candidate.Length -gt 48 -and $bodyLine) {
        $bodyLines += (Escape-Xml $bodyLine)
        $bodyLine = $bodyWord
      } else {
        $bodyLine = $candidate
      }
    }
    if ($bodyLine) { $bodyLines += (Escape-Xml $bodyLine) }
  }
  $body = ''
  for ($lineIndex = 0; $lineIndex -lt $bodyLines.Count; $lineIndex++) {
    $body += "<text x=`"146`" y=`"$([int]($bodyStart + ($lineIndex * 56)))`" class=`"body`">$($bodyLines[$lineIndex])</text>"
  }

  $indexLabel = '{0:00}' -f ($Index + 1)
  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#6d5dfc"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#1e3a8a" flood-opacity=".14"/></filter>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#dce7f7"/></pattern>
    <style>
      .sans { font-family: Arial, Helvetica, sans-serif; }
      .label { font: 600 22px Arial, Helvetica, sans-serif; letter-spacing: 3px; fill: #315a96; }
      .title { font: 700 66px Arial, Helvetica, sans-serif; fill: #102a56; }
      .body { font: 400 33px Arial, Helvetica, sans-serif; fill: #385374; }
      .mini { font: 600 24px Arial, Helvetica, sans-serif; fill: #315a96; }
      .diagram { font: 700 22px Arial, Helvetica, sans-serif; fill: #163968; }
      .small { font: 500 22px Arial, Helvetica, sans-serif; fill: #5e7494; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="#f8fbff"/>
  <rect width="1920" height="1080" fill="url(#dots)" opacity=".7"/>
  <path d="M0 0H1920V102H0z" fill="#ffffff"/>
  <path d="M0 101H1920" stroke="#dce7f7" stroke-width="2"/>
  <rect x="94" y="28" width="46" height="46" rx="14" fill="url(#accent)"/>
  <path d="M108 48l9-6 9 6v11l-9 6-9-6z" fill="none" stroke="#fff" stroke-width="3"/>
  <text x="158" y="61" class="sans" font-size="31" font-weight="700" fill="#102a56">AFC</text>
  <text x="232" y="61" class="sans" font-size="24" font-weight="500" fill="#68809d">AuraFlow Class - Machine learning foundations</text>
  <rect x="1665" y="31" width="154" height="42" rx="21" fill="#edf4ff"/>
  <text x="1712" y="59" class="mini">$indexLabel / 12</text>
  <path d="M118 212c72-68 161-86 260-53" fill="none" stroke="#75d8ff" stroke-width="13" stroke-linecap="round" opacity=".56"/>
  <text x="146" y="285" class="label">MACHINE LEARNING, EXPLAINED</text>
  $titleMarkup
  $body
  <rect x="1108" y="180" width="660" height="700" rx="42" fill="#ffffff" filter="url(#shadow)"/>
  <rect x="1108" y="180" width="660" height="700" rx="42" fill="none" stroke="#d4e3f7" stroke-width="3"/>
  $($Scene.Diagram)
  <rect x="146" y="916" width="515" height="8" rx="4" fill="#dbeafe"/>
  <rect x="146" y="916" width="$([int](42 + (($Index + 1) / 12 * 473)))" height="8" rx="4" fill="url(#accent)"/>
  <text x="146" y="973" class="small">AFC - Learn the idea, then build with it.</text>
</svg>
"@
  Set-Content -LiteralPath $Path -Value $svg -Encoding utf8
}

function New-SceneSvgV2($Scene, [int]$Index, [string]$Path) {
  $artwork = $script:ArtworkByScene[$Index]
  $copySide = if ($artwork) { $artwork.Side } else { 'left' }
  $copyX = if ($copySide -eq 'left') { 118 } else { 1060 }
  $titleWords = $Scene.Title -split ' '
  $titleLines = @()
  $titleLine = ''
  foreach ($word in $titleWords) {
    $candidate = if ($titleLine) { "$titleLine $word" } else { $word }
    if ($candidate.Length -gt 23 -and $titleLine) {
      $titleLines += $titleLine
      $titleLine = $word
    } else {
      $titleLine = $candidate
    }
  }
  if ($titleLine) { $titleLines += $titleLine }

  $titleSize = if ($titleLines.Count -gt 2) { 42 } elseif ($titleLines.Count -gt 1) { 48 } else { 58 }
  $titleMarkup = ''
  for ($i = 0; $i -lt $titleLines.Count; $i++) {
    $y = 350 + ($i * 62)
    $titleMarkup += '<text x="' + $copyX + '" y="' + $y + '" class="sans" font-size="' + $titleSize + '" font-weight="700" fill="#102a56">' + (Escape-Xml $titleLines[$i]) + '</text>'
  }

  $bodyLines = @()
  foreach ($section in ($Scene.Body -split '\|')) {
    $line = ''
    foreach ($word in ($section.Trim() -split ' ')) {
      $candidate = if ($line) { "$line $word" } else { $word }
      if ($candidate.Length -gt 38 -and $line) {
        $bodyLines += (Escape-Xml $line)
        $line = $word
      } else {
        $line = $candidate
      }
    }
    if ($line) { $bodyLines += (Escape-Xml $line) }
  }
  $bodyStart = 416 + (($titleLines.Count - 1) * 62)
  $bodyMarkup = ''
  for ($i = 0; $i -lt $bodyLines.Count; $i++) {
    $y = $bodyStart + ($i * 48)
    $bodyMarkup += '<text x="' + $copyX + '" y="' + $y + '" class="body">' + $bodyLines[$i] + '</text>'
  }

  $imageMarkup = ''
  $panelMarkup = ''
  $visualMarkup = ''
  if ($artwork) {
    $imageData = [Convert]::ToBase64String([IO.File]::ReadAllBytes($artwork.Path))
    $panelX = if ($copySide -eq 'left') { 0 } else { 970 }
    $imageMarkup = '<image href="data:image/png;base64,' + $imageData + '" x="0" y="102" width="1920" height="978" preserveAspectRatio="xMidYMid slice"/>'
    $panelMarkup = '<rect x="' + $panelX + '" y="102" width="950" height="978" fill="#f8fbff" fill-opacity=".94"/>'
    $visualMarkup = '<rect x="' + ($copyX - 28) + '" y="250" width="770" height="' + (290 + ($bodyLines.Count * 48)) + '" rx="28" fill="#ffffff" fill-opacity=".68" stroke="#d7e5f6" stroke-width="2"/>'
  } else {
    $visualMarkup = '<rect x="1050" y="194" width="700" height="690" rx="38" fill="#ffffff" filter="url(#shadow)"/><rect x="1050" y="194" width="700" height="690" rx="38" fill="none" stroke="#d4e3f7" stroke-width="3"/>' + $Scene.Diagram
  }

  $indexLabel = '{0:00}' -f ($Index + 1)
  $progressWidth = [int](42 + (($Index + 1) / 12 * 473))
  $svg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#6d5dfc"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#1e3a8a" flood-opacity=".14"/></filter>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#dce7f7"/></pattern>
    <style>
      .sans { font-family: Arial, Helvetica, sans-serif; }
      .label { font: 600 22px Arial, Helvetica, sans-serif; letter-spacing: 3px; fill: #315a96; }
      .body { font: 400 28px Arial, Helvetica, sans-serif; fill: #385374; }
      .mini { font: 600 24px Arial, Helvetica, sans-serif; fill: #315a96; }
      .diagram { font: 700 22px Arial, Helvetica, sans-serif; fill: #163968; }
      .small { font: 500 22px Arial, Helvetica, sans-serif; fill: #5e7494; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="#f8fbff"/>
  __IMAGE__
  <rect width="1920" height="1080" fill="url(#dots)" opacity=".14"/>
  __PANEL__
  <path d="M0 0H1920V102H0z" fill="#ffffff"/>
  <path d="M0 101H1920" stroke="#dce7f7" stroke-width="2"/>
  <rect x="94" y="28" width="46" height="46" rx="14" fill="url(#accent)"/>
  <path d="M108 48l9-6 9 6v11l-9 6-9-6z" fill="none" stroke="#fff" stroke-width="3"/>
  <text x="158" y="61" class="sans" font-size="31" font-weight="700" fill="#102a56">AFC</text>
  <text x="232" y="61" class="sans" font-size="24" font-weight="500" fill="#68809d">AuraFlow Class - Machine learning foundations</text>
  <rect x="1665" y="31" width="154" height="42" rx="21" fill="#edf4ff"/>
  <text x="1712" y="59" class="mini">__INDEX__ / 12</text>
  <path d="M__COPY_X__ 212c72-68 161-86 260-53" fill="none" stroke="#75d8ff" stroke-width="13" stroke-linecap="round" opacity=".56"/>
  __VISUAL__
  __TITLE__
  __BODY__
  <rect x="__COPY_X__" y="916" width="515" height="8" rx="4" fill="#dbeafe"/>
  <rect x="__COPY_X__" y="916" width="__PROGRESS__" height="8" rx="4" fill="url(#accent)"/>
  <text x="__COPY_X__" y="973" class="small">AFC - Learn the idea, then build with it.</text>
</svg>
'@
  $svg = $svg.Replace('__IMAGE__', $imageMarkup).Replace('__PANEL__', $panelMarkup).Replace('__INDEX__', $indexLabel).Replace('__COPY_X__', $copyX).Replace('__VISUAL__', $visualMarkup).Replace('__TITLE__', $titleMarkup).Replace('__BODY__', $bodyMarkup).Replace('__PROGRESS__', $progressWidth)
  Set-Content -LiteralPath $Path -Value $svg -Encoding utf8
}

function New-TypeTitleVideo([string]$Title, [string]$Side, [string]$Path, [string]$WorkRoot) {
  if (Test-Path -LiteralPath $Path) { return }
  $frames = Join-Path $WorkRoot ('type-title-' + [IO.Path]::GetFileNameWithoutExtension($Path))
  New-Item -ItemType Directory -Force -Path $frames | Out-Null
  $copyX = if ($Side -eq 'left') { 118 } else { 1060 }
  $wordLimit = 21
  $frameCount = [Math]::Min(18, [Math]::Max(9, $Title.Length))

  for ($frame = 1; $frame -le $frameCount; $frame++) {
    $length = [Math]::Min($Title.Length, [Math]::Ceiling($Title.Length * ($frame / $frameCount)))
    $partial = $Title.Substring(0, $length)
    $words = $partial -split ' '
    $lines = @()
    $line = ''
    foreach ($word in $words) {
      $candidate = if ($line) { "$line $word" } else { $word }
      if ($candidate.Length -gt $wordLimit -and $line) {
        $lines += $line
        $line = $word
      } else {
        $line = $candidate
      }
    }
    if ($line) { $lines += $line }
    $fontSize = if ($lines.Count -gt 2) { 42 } elseif ($lines.Count -gt 1) { 50 } else { 58 }
    $titleMarkup = ''
    for ($index = 0; $index -lt $lines.Count; $index++) {
      $titleMarkup += '<text x="' + $copyX + '" y="' + (350 + ($index * 62)) + '" class="display" font-size="' + $fontSize + '" fill="#102a56">' + (Escape-Xml $lines[$index]) + '</text>'
    }
    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <style>.display { font-family: Arial Black, Arial, Helvetica, sans-serif; font-weight: 900; letter-spacing: 0; }</style>
  <text x="$copyX" y="286" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="800" letter-spacing="3" fill="#6d5dfc">MACHINE LEARNING, EXPLAINED</text>
  $titleMarkup
</svg>
"@
    $svgPath = Join-Path $frames ('frame-{0:000}.svg' -f $frame)
    $pngPath = Join-Path $frames ('frame-{0:000}.png' -f $frame)
    Set-Content -LiteralPath $svgPath -Value $svg -Encoding utf8
    & node (Join-Path $PSScriptRoot 'render-afc-video-slide.mjs') $svgPath $pngPath
  }
  & ffmpeg -hide_banner -loglevel error -y -framerate 18 -i (Join-Path $frames 'frame-%03d.png') -vf 'format=rgba' -c:v qtrle -pix_fmt argb $Path
}

Require-Command ffmpeg
Require-Command ffprobe
Add-Type -AssemblyName System.Speech

$root = Split-Path -Parent $PSScriptRoot
$artworkRoot = Join-Path $root 'docs\afc-video-production\assets'
$script:ArtworkByScene = @{
  0 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'shop-forecast.png'); Side = 'left' }
  1 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'shop-forecast.png'); Side = 'left' }
  2 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'learner-data-notes.png'); Side = 'right' }
  7 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'pattern-clusters.png'); Side = 'left' }
  8 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'logistics-planner.png'); Side = 'right' }
  9 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'logistics-planner.png'); Side = 'right' }
  10 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'responsible-health-data.png'); Side = 'left' }
  11 = [pscustomobject]@{ Path = (Join-Path $artworkRoot 'shop-forecast.png'); Side = 'left' }
}
$script:ArtworkByScene.Values | ForEach-Object { if (-not (Test-Path -LiteralPath $_.Path)) { throw "Missing AFC artwork: $($_.Path)" } }
$output = Join-Path $root 'artifacts\afc-machine-learning-overview'
$slides = Join-Path $output 'slides'
$audio = Join-Path $output 'audio'
$segments = Join-Path $output 'segments'
New-Item -ItemType Directory -Force -Path $output, $slides, $audio, $segments | Out-Null

$scenes = @(
  [pscustomobject]@{ Title = 'What does machine learning actually mean?'; Body = 'It is a way for software to learn useful patterns from examples.|It is not magic, and it is not a substitute for human judgment.'; Narration = 'When people hear machine learning, it can sound mysterious. But the central idea is surprisingly practical. Instead of writing a long list of rules for every situation, we give software carefully chosen examples. The software looks for a pattern that may help with a specific task. It might estimate the next day of sales, flag a suspicious payment, or group similar customers. Machine learning is not magic. It is a tool for making limited, evidence-based predictions or decisions. And like every tool, it needs a clear purpose, good data, and responsible people around it.'; Diagram = '<circle cx="1439" cy="458" r="158" fill="#edf4ff"/><path d="M1328 478c28-92 160-124 230-38 44 54 13 143-57 153-70 10-103-60-53-106" fill="none" stroke="#2563eb" stroke-width="14" stroke-linecap="round"/><circle cx="1321" cy="529" r="18" fill="#00b9d8"/><circle cx="1565" cy="441" r="18" fill="#6d5dfc"/><text x="1262" y="744" class="diagram">EXAMPLES TO PATTERNS TO OUTPUTS</text>' }
  [pscustomobject]@{ Title = 'Start with a question people already ask'; Body = 'Will the neighbourhood shop need more bread, drinks, or rice tomorrow?|A forecast supports the owner. It does not replace the owner.'; Narration = 'Imagine a neighbourhood shop. Every morning, the owner decides what to restock. Some days, bottled drinks sell quickly. On rainy days, other items may move more slowly. Holidays, market days, and school terms can change demand too. The owner already uses experience to make a judgment. A machine learning model can support that judgment by studying past patterns and estimating likely demand. Notice the important word: support. The shop owner still understands local context, unexpected events, and customer needs in a way the model may not.'; Diagram = '<rect x="1210" y="336" width="460" height="272" rx="28" fill="#eff6ff" stroke="#b9d6ff" stroke-width="4"/><path d="M1262 607V438h72v169m15 0V365h72v242m15 0V466h72v141m15 0V405h72v202" fill="#6d5dfc" opacity=".82"/><path d="M1248 542c88-48 139 15 202-64s104-6 184-76" fill="none" stroke="#00b9d8" stroke-width="12" stroke-linecap="round"/><text x="1264" y="680" class="diagram">PAST SALES + CONTEXT = FORECAST</text><circle cx="1620" cy="755" r="44" fill="#fef3c7"/><path d="M1600 754h40m-20-20v40" stroke="#c77d00" stroke-width="7" stroke-linecap="round"/>' }
  [pscustomobject]@{ Title = 'Examples become data'; Body = 'A useful example has a clear record of what happened and when.|The model cannot learn from information it never receives.'; Narration = 'To learn from experience, software needs a record of that experience. In our shop example, each row of data might describe one day. It could include the day of the week, whether there was a promotion, the weather category, and how many bottles of a drink were sold. This is why data collection matters. If records are incomplete, inconsistent, or unrelated to the problem, the model has less to learn from. A model does not discover hidden facts by itself. It only works with the information and assumptions people provide.'; Diagram = '<rect x="1202" y="322" width="474" height="350" rx="22" fill="#ffffff" stroke="#c9dff8" stroke-width="4"/><path d="M1203 401h472M1203 470h472M1203 539h472M1320 322v350m132-350v350m125-350v350" stroke="#c9dff8" stroke-width="3"/><text x="1232" y="370" class="mini">DAY</text><text x="1356" y="370" class="mini">WEATHER</text><text x="1503" y="370" class="mini">SOLD</text><text x="1233" y="447" class="small">Mon</text><text x="1363" y="447" class="small">Sunny</text><text x="1532" y="447" class="small">86</text><text x="1233" y="516" class="small">Tue</text><text x="1363" y="516" class="small">Rain</text><text x="1532" y="516" class="small">54</text><text x="1233" y="585" class="small">Wed</text><text x="1363" y="585" class="small">Sunny</text><text x="1532" y="585" class="small">91</text><text x="1222" y="761" class="diagram">DATA IS A RECORD OF EXAMPLES</text>' }
  [pscustomobject]@{ Title = 'Features describe. Labels answer.'; Body = 'Features are the clues available before a decision.|A label is the outcome we want the model to learn to estimate.'; Narration = 'Here are two useful words. Features are the clues we give a model before it makes a prediction. In the shop example, the weekday, weather category, promotion status, and previous week sales could all be features. A label is the answer we already know in historical examples. It might be the number of drinks sold that day. During training, the model compares its prediction with the known label and adjusts. Later, when it sees new features without the answer, it can make an estimate. Choosing sensible features often matters more than choosing a fashionable algorithm.'; Diagram = '<rect x="1198" y="335" width="198" height="262" rx="28" fill="#e0f2fe"/><rect x="1484" y="335" width="198" height="262" rx="28" fill="#ede9fe"/><text x="1238" y="405" class="diagram">FEATURES</text><text x="1232" y="459" class="small">weekday</text><text x="1232" y="503" class="small">weather</text><text x="1232" y="547" class="small">promotion</text><text x="1527" y="405" class="diagram">LABEL</text><text x="1524" y="484" class="small">items sold</text><path d="M1426 462h46" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/><path d="M1452 438l28 24-28 24" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/><text x="1220" y="748" class="diagram">CLUES IN, TARGET OUT</text>' }
  [pscustomobject]@{ Title = 'Training is guided practice'; Body = 'The model makes a guess, compares it with the real answer, then adjusts.|This cycle repeats across many examples.'; Narration = 'Training is the guided-practice phase. The model receives the features from one historical example and makes a guess. We compare that guess with the known label. If the estimate was far from the real result, the learning process adjusts its internal settings slightly. Then it tries again with another example. After many examples, the goal is not to memorize every row. The goal is to learn a pattern that works on new cases too. A model that only memorizes its training data can look impressive in a demo and still fail in real life.'; Diagram = '<circle cx="1300" cy="480" r="88" fill="#dbeafe"/><circle cx="1536" cy="480" r="88" fill="#ede9fe"/><path d="M1388 480h60m88 0h-60" stroke="#2563eb" stroke-width="13" stroke-linecap="round"/><path d="M1430 450l32 30-32 30m136-60l-32 30 32 30" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/><text x="1244" y="488" class="diagram">GUESS</text><text x="1474" y="488" class="diagram">COMPARE</text><path d="M1536 568c-35 62-145 75-195 3" fill="none" stroke="#00b9d8" stroke-width="10" stroke-linecap="round"/><text x="1240" y="738" class="diagram">PREDICT, CHECK, ADJUST</text>' }
  [pscustomobject]@{ Title = 'Test with examples the model has not seen'; Body = 'Testing asks whether the pattern generalizes beyond the practice set.|A useful score depends on the real decision we care about.'; Narration = 'This is why testing matters. We keep some examples aside while training. After the model has learned from the training set, we show it those held-back examples. They are new to the model, but we know the real answers. This gives us a more honest view of how it may perform in the real world. We also choose a measure that fits the situation. For a medical alert, missing a serious case may be much more costly than a false alarm. For a stock forecast, the cost of too much and too little inventory can be different.'; Diagram = '<rect x="1206" y="340" width="180" height="248" rx="24" fill="#e0f2fe"/><rect x="1492" y="340" width="180" height="248" rx="24" fill="#fef3c7"/><text x="1241" y="408" class="diagram">TRAIN</text><text x="1234" y="459" class="small">learn patterns</text><text x="1234" y="498" class="small">from examples</text><text x="1537" y="408" class="diagram">TEST</text><text x="1516" y="459" class="small">try unseen</text><text x="1523" y="498" class="small">examples</text><path d="M1413 463h49" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/><text x="1231" y="742" class="diagram">NEW EXAMPLES ARE THE REAL CHECK</text>' }
  [pscustomobject]@{ Title = 'Supervised learning uses examples with answers'; Body = 'Input and known outcome appear together during training.|It is useful for classification and prediction problems.'; Narration = 'The first broad type is supervised learning. Think of it as learning with an answer key. Historical examples include both the inputs and the correct outcome. A model can learn to classify a message as likely spam or not spam. It can estimate delivery time, house price, or likely sales. The word supervised does not mean a person watches every prediction. It means the learning stage includes known target answers. The quality of those answers matters greatly. If labels are rushed, biased, or inconsistent, the model learns those weaknesses too.'; Diagram = '<rect x="1220" y="335" width="444" height="294" rx="28" fill="#eff6ff"/><circle cx="1312" cy="437" r="46" fill="#bfdbfe"/><text x="1270" y="444" class="diagram">INPUT</text><path d="M1380 437h84" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/><path d="M1442 408l30 29-30 29" fill="none" stroke="#2563eb" stroke-width="10"/><circle cx="1545" cy="437" r="46" fill="#c4b5fd"/><text x="1504" y="444" class="diagram">ANSWER</text><text x="1271" y="536" class="small">email text</text><text x="1493" y="536" class="small">spam / not spam</text><text x="1226" y="742" class="diagram">LEARN FROM EXAMPLES WITH KNOWN OUTCOMES</text>' }
  [pscustomobject]@{ Title = 'Unsupervised learning looks for structure'; Body = 'There is no answer key. The goal is to discover groups or relationships.|It can reveal patterns worth investigating, not final truth.'; Narration = 'The second broad type is unsupervised learning. Here, there may be no target answer at all. Instead, the model looks for structure in the data. It could group customers with similar purchasing patterns, highlight unusual activity, or reduce a complicated data set into a simpler view. These groups do not automatically explain themselves. A cluster is a clue, not a conclusion. People still need to ask what the group means, whether the data is reliable, and whether acting on that pattern would be fair and useful.'; Diagram = '<rect x="1218" y="311" width="452" height="360" rx="28" fill="#f5f3ff"/><circle cx="1320" cy="430" r="18" fill="#2563eb"/><circle cx="1364" cy="401" r="18" fill="#2563eb"/><circle cx="1381" cy="458" r="18" fill="#2563eb"/><circle cx="1515" cy="479" r="18" fill="#00b9d8"/><circle cx="1552" cy="427" r="18" fill="#00b9d8"/><circle cx="1593" cy="494" r="18" fill="#00b9d8"/><circle cx="1298" cy="550" r="18" fill="#6d5dfc"/><circle cx="1354" cy="588" r="18" fill="#6d5dfc"/><ellipse cx="1352" cy="437" rx="105" ry="83" fill="none" stroke="#2563eb" stroke-width="6" stroke-dasharray="12 14"/><ellipse cx="1555" cy="463" rx="102" ry="83" fill="none" stroke="#00b9d8" stroke-width="6" stroke-dasharray="12 14"/><text x="1260" y="742" class="diagram">FIND GROUPS. THEN ASK BETTER QUESTIONS.</text>' }
  [pscustomobject]@{ Title = 'Machine learning already appears in everyday systems'; Body = 'Recommendations, forecasts, image tools, translation, and fraud checks use patterns.|The right approach depends on the risk and the context.'; Narration = 'You can see machine learning in recommendations, translation tools, route estimates, image organization, fraud checks, and demand forecasts. But a common pattern does not mean every problem needs a model. Sometimes a simple spreadsheet, a clear rule, or a conversation with a person is safer and more effective. The question is not, can we add artificial intelligence? The better question is, what problem are we solving, for whom, and how will we know whether it helped? Good technology begins with a useful problem, not a trend.'; Diagram = '<circle cx="1438" cy="471" r="86" fill="#eff6ff" stroke="#2563eb" stroke-width="8"/><text x="1365" y="481" class="diagram">PATTERNS</text><path d="M1438 385V306m0 251v80m-86-166h-79m251 0h80" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/><rect x="1226" y="248" width="112" height="68" rx="18" fill="#c4b5fd"/><rect x="1538" y="248" width="112" height="68" rx="18" fill="#a5f3fc"/><rect x="1226" y="626" width="112" height="68" rx="18" fill="#fde68a"/><rect x="1538" y="626" width="112" height="68" rx="18" fill="#bfdbfe"/><text x="1238" y="290" class="small">ROUTES</text><text x="1553" y="290" class="small">FRAUD</text><text x="1240" y="668" class="small">IMAGES</text><text x="1553" y="668" class="small">STOCK</text><text x="1240" y="770" class="diagram">USE A MODEL ONLY WHEN IT EARNS ITS PLACE</text>' }
  [pscustomobject]@{ Title = 'Define success before you build'; Body = 'Choose a concrete outcome, a sensible measure, and a human owner.|A model is only valuable when it improves a real workflow.'; Narration = 'Before building anything, define success. Is the aim to reduce wasted stock? Respond to customer questions faster? Help a teacher spot learners who may need support? Make the goal specific. Decide what measure will show improvement. Name the person responsible for reviewing the result. And make room for feedback when the system gets something wrong. This turns machine learning from a vague idea into a practical project. A successful model is not simply accurate in a notebook. It fits safely into a real workflow and helps someone make a better decision.'; Diagram = '<path d="M1262 400h154l51 70-51 70h-154l-51-70z" fill="#dbeafe" stroke="#2563eb" stroke-width="6"/><path d="M1463 400h154l51 70-51 70h-154l-51-70z" fill="#ede9fe" stroke="#6d5dfc" stroke-width="6"/><text x="1264" y="478" class="diagram">GOAL</text><text x="1470" y="478" class="diagram">MEASURE</text><path d="M1435 650h160" stroke="#00b9d8" stroke-width="10" stroke-linecap="round"/><path d="M1515 620l30 30-30 30" fill="none" stroke="#00b9d8" stroke-width="9"/><text x="1310" y="738" class="diagram">HUMAN REVIEW CLOSES THE LOOP</text>' }
  [pscustomobject]@{ Title = 'Responsible systems need more than accuracy'; Body = 'Check for bias, protect private information, and explain important decisions.|High-impact choices need meaningful human oversight.'; Narration = 'Responsible machine learning asks more questions. Does the data represent the people affected by the system? Could a prediction create unfair treatment? Are we collecting only the information we truly need? How will we protect it? Can someone challenge an important result? In a low-risk recommendation, a mistake may be inconvenient. In hiring, lending, health, education, or public services, a mistake can have serious consequences. That is why privacy, fairness, security, and human oversight are design requirements, not optional decorations added at the end.'; Diagram = '<path d="M1437 314l180 66v142c0 122-88 195-180 234-92-39-180-112-180-234V380z" fill="#eff6ff" stroke="#2563eb" stroke-width="9"/><path d="M1400 513l30 30 60-72" fill="none" stroke="#00b9d8" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/><text x="1330" y="641" class="diagram">FAIR · PRIVATE · SECURE</text><text x="1224" y="770" class="diagram">RESPONSIBILITY IS PART OF THE SYSTEM</text>' }
  [pscustomobject]@{ Title = 'Your next step: learn by building'; Body = 'Pick one small prediction problem. Describe the data, feature, label, and measure.|Then test your idea before trusting it.'; Narration = 'You now have the essential map. Machine learning learns patterns from examples. Features describe what is known. Labels describe the answer in past examples. Training adjusts a model, and testing checks whether the pattern works on new data. Supervised learning uses known answers. Unsupervised learning explores structure. Most importantly, useful systems begin with a clear human problem and are judged by the value and risk they create. In the next AFC lesson, you will turn a simple question into a structured machine learning problem. Start small, test honestly, and keep people in the decision loop. When you are ready, open the practice prompt, write your first project note, and complete the checkpoint before you move on.'; Diagram = '<circle cx="1438" cy="456" r="170" fill="#edf4ff"/><path d="M1390 455l35 35 72-84" fill="none" stroke="#00b9d8" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><text x="1282" y="706" class="diagram">START SMALL. TEST HONESTLY. BUILD RESPONSIBLY.</text><rect x="1274" y="767" width="328" height="64" rx="32" fill="url(#accent)"/><text x="1353" y="809" class="sans" font-size="27" font-weight="700" fill="#ffffff">CONTINUE IN AFC</text>' }
)

$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.SelectVoice('Microsoft Hazel Desktop')
$voice.Rate = 4
$voice.Volume = 100
$durations = @()
$currentTime = 0.0
$vtt = "WEBVTT`r`n`r`n"

for ($index = 0; $index -lt $scenes.Count; $index++) {
  $scene = $scenes[$index]
  $sceneNumber = '{0:00}' -f ($index + 1)
  $svgPath = Join-Path $slides "scene-$sceneNumber.svg"
  $pngPath = Join-Path $slides "scene-$sceneNumber.png"
  $titleVideo = Join-Path $slides "title-$sceneNumber.mov"
  $wavPath = Join-Path $audio "scene-$sceneNumber.wav"
  $mp4Path = Join-Path $segments "scene-$sceneNumber.mp4"
  $baseScene = [pscustomobject]@{ Title = ''; Body = ''; Diagram = $scene.Diagram }
  New-SceneSvgV2 -Scene $baseScene -Index $index -Path $svgPath
  & node (Join-Path $PSScriptRoot 'render-afc-video-slide.mjs') $svgPath $pngPath
  $titleSide = if ($script:ArtworkByScene.ContainsKey($index)) { $script:ArtworkByScene[$index].Side } else { 'left' }
  New-TypeTitleVideo -Title $scene.Title -Side $titleSide -Path $titleVideo -WorkRoot $slides
  $voice.SetOutputToWaveFile($wavPath)
  $voice.Speak("$($scene.Title). $($scene.Narration)")
  $voice.SetOutputToNull()
  $duration = Get-WavDuration $wavPath
  $durations += $duration
  $captionSentences = @(("$($scene.Title). $($scene.Narration)") -split '(?<=[.!?])\s+' | Where-Object { $_.Trim() })
  $captionDuration = $duration / $captionSentences.Count
  for ($captionIndex = 0; $captionIndex -lt $captionSentences.Count; $captionIndex++) {
    $captionStart = $currentTime + ($captionIndex * $captionDuration)
    $captionEnd = $captionStart + $captionDuration
    $vtt += "$(To-VttTime $captionStart) --> $(To-VttTime $captionEnd)`r`n$($captionSentences[$captionIndex].Trim())`r`n`r`n"
  }
  $videoFilter = "[0:v]scale=1920:1080,zoompan=z='min(zoom+0.00016,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=25[base];[1:v]format=rgba,setpts=PTS-STARTPTS+0.35/TB[title];[base][title]overlay=0:0:eof_action=repeat:enable='gte(t,0.35)',format=yuv420p[v]"
  & ffmpeg -hide_banner -loglevel error -y -loop 1 -i $pngPath -i $titleVideo -i $wavPath -filter_complex $videoFilter -map '[v]' -map 2:a -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 192k -shortest -movflags +faststart $mp4Path
  $currentTime += $duration
}

$voice.Dispose()
Set-Content -LiteralPath (Join-Path $output 'afc-machine-learning-overview.vtt') -Value $vtt -Encoding utf8

$concatPath = Join-Path $output 'segments.txt'
$segmentLines = 0..($scenes.Count - 1) | ForEach-Object { $name = 'scene-{0:00}.mp4' -f ($_ + 1); "file 'segments/$name'" }
Set-Content -LiteralPath $concatPath -Value $segmentLines -Encoding ascii
$finalVideo = Join-Path $output 'afc-machine-learning-overview.mp4'
# Re-encode the join so every scene boundary has continuous timestamps and no copied-keyframe flash.
# `-shortest` removes the small visual tail produced by transparent title overlays.
& ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $concatPath -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 192k -shortest -movflags +faststart $finalVideo

# Preserve a calm draft narration while keeping the delivery below AFC's six-minute release cap.
$releaseCapSeconds = 358
$renderedSeconds = [double](& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo)
if ($renderedSeconds -gt $releaseCapSeconds) {
  $pace = $renderedSeconds / $releaseCapSeconds
  $pacedVideo = Join-Path $output 'afc-machine-learning-overview-paced.mp4'
  $filters = "[0:v]setpts=PTS/$([Math]::Round($pace, 6))[v];[0:a]atempo=$([Math]::Round($pace, 6))[a]"
  & ffmpeg -hide_banner -loglevel error -y -i $finalVideo -filter_complex $filters -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 192k -movflags +faststart $pacedVideo
  Copy-Item -LiteralPath $pacedVideo -Destination $finalVideo -Force

  $vttPath = Join-Path $output 'afc-machine-learning-overview.vtt'
  $vtt = Get-Content -LiteralPath $vttPath
  $pacedVtt = foreach ($line in $vtt) {
    if ($line -match '^(.+) --> (.+)$') {
      "$(To-VttTime ((From-VttTime $Matches[1]) / $pace)) --> $(To-VttTime ((From-VttTime $Matches[2]) / $pace))"
    } else {
      $line
    }
  }
  Set-Content -LiteralPath $vttPath -Value $pacedVtt -Encoding utf8
}

# The transparent title stream can leave a small visual tail after the final AAC sample.
# Align the release container to its narration so learners never reach a silent static frame.
$videoStreamSeconds = [double](& ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo)
$audioStreamSeconds = [double](& ffprobe -v error -select_streams a:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo)
if ($videoStreamSeconds -gt ($audioStreamSeconds + 0.1)) {
  $alignedVideo = Join-Path $output 'afc-machine-learning-overview-aligned.mp4'
  & ffmpeg -hide_banner -loglevel error -y -i $finalVideo -t $([Math]::Round($audioStreamSeconds, 3)) -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 192k -movflags +faststart $alignedVideo
  Copy-Item -LiteralPath $alignedVideo -Destination $finalVideo -Force
}

$thumbnail = Join-Path $output 'afc-machine-learning-overview-thumbnail.png'
Copy-Item -LiteralPath (Join-Path $slides 'scene-01.png') -Destination $thumbnail -Force
$preview = Join-Path $output 'afc-machine-learning-overview-preview.mp4'
& ffmpeg -hide_banner -loglevel error -y -stream_loop -1 -i (Join-Path $slides 'scene-01.png') -t 10 -filter:v "scale=1280:720,zoompan=z='min(zoom+0.00035,1.05)':d=1:s=1280x720:fps=25,format=yuv420p" -an -c:v libx264 -preset veryfast -crf 20 -movflags +faststart $preview

$chapters = @(
  '# YouTube upload details',
  '',
  '## Title',
  'Machine Learning Explained: How Computers Learn From Examples | AFC',
  '',
  '## Description',
  'Machine learning is a practical way for software to learn useful patterns from examples. This AFC beginner lesson explains data, features, labels, training, testing, supervised learning, unsupervised learning, and responsible use through an everyday forecasting example.',
  '',
  '## Chapters',
  '00:00 What machine learning means',
  '00:25 A practical prediction problem',
  '00:50 Examples become data',
  '01:15 Features and labels',
  '01:40 Training and testing',
  '02:30 Supervised and unsupervised learning',
  '03:20 Everyday applications',
  '03:45 Responsible use',
  '04:30 Your next step',
  '',
  '## Tags',
  'machine learning for beginners, Python, data science, AFC, AuraFlow Class, technology education, Ghana',
  '',
  '## Before publishing',
  '- Replace the desktop voice with an approved human or licensed neural narration track.',
  '- Check captions against the final narration.',
  '- Upload as Unlisted until AFC review is complete.',
  '- Use the generated PNG as the first thumbnail draft and add final channel-safe title treatment in YouTube Studio.',
  '- Add the final YouTube URL to the AFC lesson through the instructor course editor.'
) -join "`r`n"
Set-Content -LiteralPath (Join-Path $output 'youtube-upload.md') -Value $chapters -Encoding utf8

if (-not $KeepWorkFiles) {
  Remove-Item -LiteralPath $segments -Recurse -Force
}

$releaseDurationSeconds = [double](& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo)
$durationMinutes = [Math]::Round($releaseDurationSeconds / 60, 2)
Write-Host "Rendered $finalVideo ($durationMinutes minutes; $([Math]::Round($releaseDurationSeconds, 2)) seconds)"
Write-Host "Preview: $preview"
Write-Host "Captions: $(Join-Path $output 'afc-machine-learning-overview.vtt')"
