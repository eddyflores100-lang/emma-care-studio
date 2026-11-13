# Contributing

Thanks for helping improve Emma Care Studio.

## Development

Use the versions and commands documented in README. Before changing gameplay, inspect the existing command parser, pet identity/selection logic, world progression, save migration and import/export behavior.

## Pull requests

- Keep changes focused and explain the player-visible behavior.
- Test keyboard and touch interactions at mobile and desktop sizes.
- For voice changes, test permission denied, unsupported browser, ambiguous recognition and multi-word or accented pet names.
- For save changes, test current saves, supported migrations, backup/restore and malformed imports.
- Preserve the rule that a named command affects only the selected pet.
- Do not add hidden collection or transmission of microphone audio or personal data.

Include test commands, browser/device tested, screenshots where useful and known limitations.
