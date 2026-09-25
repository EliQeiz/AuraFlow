[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Render-SvgLayer([string]$Svg, [string]$Path) {
  $svgPath = [IO.Path]::ChangeExtension($Path, '.svg')
  Set-Content -LiteralPath $svgPath -Value $Svg -Encoding utf8
  & node (Join-Path $PSScriptRoot 'render-afc-video-slide.mjs') $svgPath $Path
}

function New-Layer([string]$Content) {
  return @"
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <style>
    .sans { font-family: Arial, Helvetica, sans-serif; }
    .display { font-family: Arial Black, Arial, Helvetica, sans-serif; font-weight: 900; letter-spacing: 0; }
    .label { font-family: Arial, Helvetica, sans-serif; font-weight: 800; letter-spacing: 2px; }
  </style>
  $Content
</svg>
"@
}

function Render-TypeOnVideo(
  [string]$Text,
  [int]$X,
  [int]$Y,
  [int]$FontSize,
  [string]$Color,
  [string]$Name,
  [string]$OutputDirectory
) {
  $frames = Join-Path $OutputDirectory "type-$Name"
  $video = Join-Path $OutputDirectory "type-$Name.mov"
  if (Test-Path -LiteralPath $video) { return $video }
  New-Item -ItemType Directory -Force -Path $frames | Out-Null
  $count = [Math]::Max(8, $Text.Length)
  for ($index = 1; $index -le $count; $index++) {
    $visible = [Math]::Min($Text.Length, [Math]::Ceiling($Text.Length * ($index / $count)))
    $partial = [System.Security.SecurityElement]::Escape($Text.Substring(0, $visible))
    $svg = New-Layer @"
<text x="$X" y="$Y" class="display" font-size="$FontSize" fill="$Color">$partial</text>
"@
    $path = Join-Path $frames ('frame-{0:000}.png' -f $index)
    Render-SvgLayer $svg $path
  }
  & ffmpeg -hide_banner -loglevel error -y -framerate 18 -i (Join-Path $frames 'frame-%03d.png') -vf 'format=rgba' -c:v qtrle -pix_fmt argb $video
  return $video
}

foreach ($command in 'ffmpeg', 'ffprobe', 'node') {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "$command is required." }
}
Add-Type -AssemblyName System.Speech

$root = Split-Path -Parent $PSScriptRoot
$assetRoot = Join-Path $root 'docs\afc-video-production\assets'
$output = Join-Path $root 'artifacts\afc-machine-learning-overview\motion-prototype'
New-Item -ItemType Directory -Force -Path $output | Out-Null

$shop = Join-Path $assetRoot 'shop-forecast.png'
if (-not (Test-Path -LiteralPath $shop)) { throw 'The required AFC visual asset is missing.' }

$background = Join-Path $output 'board.png'
$introLabel = Render-TypeOnVideo 'THE SIMPLE IDEA' 104 292 22 '#6d5dfc' 'label' $output
$introLineOne = Render-TypeOnVideo 'MACHINE LEARNING' 104 390 71 '#0d2854' 'line-one' $output
$introLineTwo = Render-TypeOnVideo 'LEARNS PATTERNS' 104 474 71 '#1467e8' 'line-two' $output
$introLineThree = Render-TypeOnVideo 'FROM EXAMPLES.' 104 558 71 '#00a7c7' 'line-three' $output
$pastSales = Join-Path $output 'past-sales.png'
$clues = Join-Path $output 'clues.png'
$answer = Join-Path $output 'answer.png'
$forecastPath = Join-Path $output 'forecast-path.png'
$stock = Join-Path $output 'stock.png'

Render-SvgLayer (New-Layer @'
<defs>
  <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#dfe6f1" stroke-width="1.5"/></pattern>
  <linearGradient id="wash" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fdfcf7"/><stop offset="1" stop-color="#edf5ff"/></linearGradient>
</defs>
<rect width="1920" height="1080" fill="url(#wash)"/>
<rect width="1920" height="1080" fill="url(#grid)" opacity=".8"/>
<rect x="80" y="70" width="106" height="52" rx="18" fill="#1467e8"/>
<text x="110" y="105" class="display" font-size="28" fill="#fff">AFC</text>
<text x="215" y="105" class="label" font-size="21" fill="#254363">MACHINE LEARNING FOUNDATIONS</text>
<path d="M80 150H1840" stroke="#cbd9ea" stroke-width="3"/>
<rect x="1030" y="232" width="700" height="590" rx="44" fill="#0d2a57" opacity=".10"/>
<text x="82" y="970" class="label" font-size="19" fill="#5b7190">AURA FLOW CLASS / ORIGINAL LEARNING VISUAL</text>
'@) $background

Render-SvgLayer (New-Layer @'
<rect x="105" y="686" width="255" height="132" rx="26" fill="#ffffff" stroke="#1467e8" stroke-width="4"/>
<text x="135" y="732" class="label" font-size="18" fill="#1467e8">EXAMPLE</text>
<text x="135" y="786" class="display" font-size="28" fill="#16375e">PAST SALES</text>
'@) $pastSales

Render-SvgLayer (New-Layer @'
<rect x="390" y="686" width="255" height="132" rx="26" fill="#ffffff" stroke="#6d5dfc" stroke-width="4"/>
<text x="420" y="732" class="label" font-size="18" fill="#6d5dfc">CLUES</text>
<text x="420" y="780" class="display" font-size="22" fill="#16375e">DAY, WEATHER,</text>
<text x="420" y="812" class="display" font-size="22" fill="#16375e">PROMOTION</text>
'@) $clues

Render-SvgLayer (New-Layer @'
<rect x="675" y="686" width="255" height="132" rx="26" fill="#ffffff" stroke="#00a7c7" stroke-width="4"/>
<text x="705" y="732" class="label" font-size="18" fill="#00a7c7">ANSWER</text>
<text x="705" y="786" class="display" font-size="25" fill="#16375e">NUMBER SOLD</text>
'@) $answer

Render-SvgLayer (New-Layer @'
<path d="M1040 857 C1190 763, 1362 918, 1545 796" fill="none" stroke="#1467e8" stroke-width="12" stroke-linecap="round"/>
<path d="M1518 770l48 25-37 38" fill="none" stroke="#1467e8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
'@) $forecastPath

Render-SvgLayer (New-Layer @'
<rect x="1214" y="860" width="355" height="116" rx="28" fill="#1467e8"/>
<text x="1255" y="908" class="label" font-size="18" fill="#d9eeff">PLAN TOMORROW'S</text>
<text x="1255" y="950" class="display" font-size="34" fill="#fff">STOCK</text>
'@) $stock

$voiceText = 'Machine learning learns patterns from examples. In this shop, past sales are examples. The day, weather, and promotion are clues. The number sold is the answer. The model studies those examples to help the owner plan tomorrow''s stock.'
$wav = Join-Path $output 'narration.wav'
$masteredWav = Join-Path $output 'narration-mastered.wav'
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.SelectVoice('Microsoft Hazel Desktop')
$voice.Rate = -1
$voice.SetOutputToWaveFile($wav)
$voice.Speak($voiceText)
$voice.SetOutputToNull()
$voice.Dispose()

& ffmpeg -hide_banner -loglevel error -y -i $wav -af 'highpass=f=80,lowpass=f=13000,acompressor=threshold=-19dB:ratio=2.2:attack=20:release=180:makeup=4,loudnorm=I=-16:LRA=8:TP=-1.5' $masteredWav
$duration = [double](& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $masteredWav)
$video = Join-Path $output 'afc-motion-prototype.mp4'
$filter = @'
[0:v]scale=1920:1080,format=rgba[board];
[1:v]scale=700:-1,format=rgba[shop];
[board][shop]overlay=x='if(lt(t,6.4),1920-(t-3.4)*278,1030)':y=232:enable='between(t,3.4,28)'[b1];
[2:v]format=rgba,setpts=PTS-STARTPTS+0.5/TB[label];
[b1][label]overlay=0:0:eof_action=repeat:enable='gte(t,0.5)'[b2];
[3:v]format=rgba,setpts=PTS-STARTPTS+1.0/TB[lineone];
[b2][lineone]overlay=0:0:eof_action=repeat:enable='gte(t,1.0)'[b3];
[4:v]format=rgba,setpts=PTS-STARTPTS+2.2/TB[linetwo];
[b3][linetwo]overlay=0:0:eof_action=repeat:enable='gte(t,2.2)'[b4];
[5:v]format=rgba,setpts=PTS-STARTPTS+3.4/TB[linethree];
[b4][linethree]overlay=0:0:eof_action=repeat:enable='gte(t,3.4)'[b5];
[6:v]format=rgba[examplesales];
[b5][examplesales]overlay=x='if(lt(t,8.1),-385+(t-6.7)*275,0)':y=0:enable='between(t,6.7,28)'[b6];
[7:v]format=rgba[exampleclues];
[b6][exampleclues]overlay=x=0:y='if(lt(t,10.7),1080-(t-9.3)*283,0)':enable='between(t,9.3,28)'[b7];
[8:v]format=rgba[exampleanswer];
[b7][exampleanswer]overlay=x='if(lt(t,13.3),1920-(t-11.9)*890,0)':y=0:enable='between(t,11.9,28)'[b8];
[9:v]format=rgba[path];
[b8][path]overlay=x='if(lt(t,15.8),-960+(t-14.5)*738,0)':y=0:enable='between(t,14.5,28)'[b9];
[10:v]format=rgba[stock];
[b9][stock]overlay=x=0:y='if(lt(t,17.3),1080-(t-16.0)*831,0)':enable='between(t,16.0,28)'[b10];
[b10]fade=t=in:st=0:d=0.3,format=yuv420p[v]
'@
& ffmpeg -hide_banner -loglevel error -y -loop 1 -i $background -loop 1 -i $shop -i $introLabel -i $introLineOne -i $introLineTwo -i $introLineThree -loop 1 -i $pastSales -loop 1 -i $clues -loop 1 -i $answer -loop 1 -i $forecastPath -loop 1 -i $stock -i $masteredWav -filter_complex $filter -map '[v]' -map 11:a -shortest -r 25 -c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 192k -movflags +faststart $video

Write-Host "Rendered prototype: $video"
Write-Host "Narration duration: $([Math]::Round($duration, 1)) seconds"
