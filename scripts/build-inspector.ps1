$ErrorActionPreference = 'Stop'
$studioRoot = Split-Path -Parent $PSScriptRoot
$studioVswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (-not (Test-Path -LiteralPath $studioVswhere)) { throw 'Visual Studio C++ Build Tools are required' }
$studioVsRoot = & $studioVswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $studioVsRoot) { throw 'No installed x64 C++ toolchain was found' }
$studioCmake = Join-Path $studioVsRoot 'Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
$studioBuild = Join-Path $studioRoot 'artifacts\native-inspector'
& $studioCmake -S (Join-Path $studioRoot 'native\plugin-inspector') -B $studioBuild -A x64
if ($LASTEXITCODE -ne 0) { throw 'Inspector configuration failed' }
& $studioCmake --build $studioBuild --config Release
if ($LASTEXITCODE -ne 0) { throw 'Inspector build failed' }
