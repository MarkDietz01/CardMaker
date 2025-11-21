# CardMaker Desktop wrapper

Deze map bevat een klein WPF-project dat de bestaande `index.html` in een WebView2 host. De output is een echte `CardMaker Studio.exe` voor Windows.

## Bouwen
1. Installeer [.NET 8 SDK](https://dotnet.microsoft.com/) en de [Microsoft Edge WebView2 runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
2. Open een terminal in `CardMaker.Desktop`.
3. Gebruik één opdracht om de .exe te genereren (de bundel downloadt lokaal `html2canvas` en `jspdf` zodat export ook offline werkt):
   ```powershell
   ./build-windows.ps1
   ```
   De resulterende `CardMaker.Desktop.exe` staat in `CardMaker.Desktop/bin/Release/net8.0-windows/win10-x64/publish/`.
4. Optioneel: voeg `-SelfContained` toe als je alle .NET bits mee wilt bundelen:
   ```powershell
   ./build-windows.ps1 -SelfContained
   ```

De build stap kopieert automatisch `../index.html`, `../styles.css` en `../script.js` naar de map `wwwroot/` naast de .exe zodat alle functionaliteit (live preview, deck management en export naar PNG/JPEG/PDF) offline beschikbaar blijft.
