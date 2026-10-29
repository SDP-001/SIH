$wsh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "APAAR Vault.lnk"
$targetPath = "wscript.exe"
$arguments = "`"c:\Users\SDP\OneDrive\Desktop\SIH 2.0\APAAR-Vault-Silent.vbs`""
$iconPath = "c:\Users\SDP\OneDrive\Desktop\SIH 2.0\app_icon.ico"

$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = "c:\Users\SDP\OneDrive\Desktop\SIH 2.0"
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = "APAAR-Vault - AI Academic Verification Platform"
$shortcut.Save()

Write-Host "SUCCESS: Desktop shortcut created at $shortcutPath"
