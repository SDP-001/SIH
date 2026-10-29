Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\SDP\OneDrive\Desktop\SIH 2.0"
WshShell.Run "cmd /c Start-APAAR-Vault-App.bat", 0, False
Set WshShell = Nothing
