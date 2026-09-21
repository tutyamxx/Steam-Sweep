# Steam Sweep 🧹

<p align="center">
	<img src="steamsweep.webp" alt="Steam Sweep demo">
</p>

- A lightweight Windows desktop utility for finding unnecessary leftover files in your Steam game libraries. 🎮
- Steam Sweep scans installed Steam games for files and folders that may no longer be needed, helping you identify clutter and reclaim disk space. 💾

> ⚠️ **Steam Sweep is unofficial software and is not affiliated with Valve Corporation or Steam.**

## ✨ Features

- Automatically scan your Steam games and find unnecessary leftovers
- Discover installed games across all your Steam libraries and drives
- Select exactly what you want to remove, individual files or an entire batch
- See exactly how much disk space you can reclaim before cleaning
- Automatic updates

## 🧹 Cleanup Detection

| Type | What Steam Sweep Finds |
|---|---|
| Temporary Folders | Common temporary directories such as `tmp`, `temp`, `temporary`, `deriveddatacache`, and incomplete download folders |
| Temporary Files | Temporary files such as `.tmp`, `.temp`, and `.crdownload` |
| Log Files | Log files such as `.log`, `.txt_log`, `.trace`, and `.etl`, plus common log directories |
| Crash Dumps | Crash dumps and error reports such as `.dmp`, `.mdmp`, `.hdmp`, and `.wer`, plus common crash-report directories |
| Backup Files | Backup files such as `.bak`, `.old`, `.orig`, `.backup`, `.sav.bak`, and temporary `~` copies |
| Installers | Standalone installer executables such as `setup.exe`, `installer.exe`, `install.exe`, `dxsetup.exe`, and similar setup programs |
| Installer Archives | Common DirectX, Visual C++, .NET, PhysX, XNA, OpenAL, EA, Epic Games, Ubisoft, and other redistributable installers or archives |
| Empty Folders | Folders containing no files or subfolders |

> ⚠️ If you see the same empty folders reappear after running the cleaner and scanning again, this is most likely because Steam automatically recreates them when they are needed.

## ⚠️ Windows SmartScreen Warning

- When launching the installer (`SteamSweep.Setup.X.X.X.exe`), Windows Defender SmartScreen may display a warning stating:

<p align="center">
	<img src="windowsdefender.png" alt="Windows Defender SmartScreen">
</p>

## 📥 Downloading

1. Go to the [Steam Sweep Releases](https://github.com/tutyamxx/Steam-Sweep/releases) page.
2. Open the latest release.
3. Under **Assets**, download `SteamSweep.Setup.X.X.X.exe`.
4. Run the installer and follow the installation prompts.
5. Launch **Steam Sweep** once installation is complete.

## 🔒 Safety

- Steam Sweep is designed to inspect Steam files before performing cleanup.
- The scanner itself is **read-only** and does not modify files while scanning.
- Cleanup actions should only be performed on files identified by Steam Sweep as cleanup candidates.

### Why does this happen?

- This warning appears because the executable is **not digitally signed** with a paid code-signing certificate (which can cost hundreds of dollars per year). Since this is an open-source project, the app has not yet accumulated enough download reputation with Microsoft SmartScreen. **The app is completely safe to run.**


### How to install:
1. Click on **More info** in the SmartScreen popup.
2. Click the **Run anyway** button that appears at the bottom.

## 📜 License

Steam Sweep is licensed under the PolyForm Non commercial License 1.0.0.
Commercial use is not permitted without permission from the copyright holder.
