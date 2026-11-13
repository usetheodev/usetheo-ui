---
"@usetheo/ui": minor
---

`Stepper` and `Dialog.Content` let an app translate the text they write for screen readers.

`Stepper` takes `stateLabels` (`{ done, failed, pending }`): the state spoken after each step's label.
A state left out keeps its English text. `Dialog.Content` takes `closeLabel`, the name of the corner
close button, which defaults to "Close". Until now both were fixed English strings, so an app in
another language announced them in English (#37).
