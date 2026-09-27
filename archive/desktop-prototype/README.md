# Archived desktop prototype

This directory preserves the original Python/PySide6 recipe picker. It is no longer used by the React application in `../../web`.

Its database, source meal catalog, and original image assets remain alongside the Python source so relative file paths continue to work.

## Run it from the repository root

```powershell
cd archive\desktop-prototype
..\..\.venv\Scripts\python.exe -m pip install -r .\requirements.txt
..\..\.venv\Scripts\python.exe .\main.py
```

The `mvc-experiment/` directory contains a later, incomplete refactoring attempt plus its original ZIP snapshot. It is retained for reference and is not expected to run as-is.
