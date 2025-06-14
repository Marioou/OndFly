Set oWS = WScript.CreateObject("WScript.Shell")
Set oShortcut = oWS.CreateShortcut(oWS.SpecialFolders("Desktop") & "\Daily Organizer.lnk")
oShortcut.TargetPath = "c:\Users\Admin\Documents\daily-organizer\start-daily-organizer.bat"
oShortcut.IconLocation = "c:\Users\Admin\Documents\daily-organizer\public\icon.png"
oShortcut.Save
