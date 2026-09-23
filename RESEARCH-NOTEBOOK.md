# Research Notebook — local workflow

Quartz project: D:\Project\quartz
Only publishing source: C:\Users\zzy18\OneDrive\Documents\Obsidian Vault\public

## Preview
In PowerShell:

    cd D:\Project\quartz
    npm run research:preview

Open http://localhost:8080. Save notes in Obsidian to refresh the preview. Stop with Ctrl+C.

## Add an experiment
Copy public/templates/experiment.md into public with a descriptive filename. Fill it in, replace the date placeholders, then set draft: false when ready. The templates folder is excluded from the website. Use tags such as experiment, eeg, negative-result, or methods. Obsidian wikilinks, Markdown images, math, and Mermaid are supported.

Put all intended public attachments in public/assets. Keep private notes and private attachments outside public. Everything placed in public is intended for sharing; draft filtering hides Markdown pages but is not protection for their attachments. Avoid mentioning private note titles in public links. Never point Quartz at the vault root. The wrapper checks for links escaping public before starting; restart it after changing filesystem links.

The home page is public/index.md; edit it in Obsidian to feature additional experiments. Search and file navigation discover new pages automatically. The original EEG note is unchanged.

## Build for hosting

    npm run research:build

The generated website is D:\Project\quartz\public (different from the Obsidian source folder). Upload only this generated folder to your static host. No deployment or Git push has been configured. For future automated builds, sync only the Obsidian public folder to a dedicated publishing repository or CI content folder, never the whole vault.

Once you choose a host/domain, set configuration.baseUrl in quartz.config.yaml and enable sitemap/RSS in the content-index plugin. They are disabled until a real site URL is available. Analytics are disabled.
