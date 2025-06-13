Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta del directorio actual
strCurrentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
objShell.CurrentDirectory = strCurrentDir

' Configurar variables de entorno
objShell.Environment("PROCESS")("BROWSER") = "none"
objShell.Environment("PROCESS")("REACT_APP_USE_EMULATOR") = "false"

' Verificar si la aplicacion ya esta ejecutandose
strCommand = "cmd /c netstat -an | find "":3000"""
intResult = objShell.Run(strCommand, 0, True)

If intResult = 0 Then
    ' La aplicacion ya esta ejecutandose, solo abrir navegador en modo PWA
    objShell.Run "chrome --app=http://localhost:3000 --window-size=1200,900 --window-position=100,100", 1, False
    WScript.Quit
End If

' Verificar si node_modules existe
If Not objFSO.FolderExists(strCurrentDir & "\node_modules") Then
    ' Instalar dependencias silenciosamente
    objShell.Run "cmd /c npm install --silent", 0, True
End If

' Iniciar la aplicación de React en CMD visible para depuración
Dim cmdCommand
cmdCommand = "cmd.exe /k cd /d \"" & strCurrentDir & "\" && npm start"
objShell.Run cmdCommand, 1, False

' Esperar un momento para que la aplicación arranque
WScript.Sleep 5000

' Abrir el navegador en modo PWA/App standalone
objShell.Run "chrome --app=http://localhost:3000 --window-size=1200,900 --window-position=100,100", 1, False
