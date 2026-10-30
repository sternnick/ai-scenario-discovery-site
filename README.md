# The Gains from AI

The public website of the scenario study *The Gains from AI*. This repository holds **the
published output only**. It exists so that the rendered site can be public while the research code,
the retrieved data and the model behind it stay in a private backend repository.

| | |
|---|---|
| Live site | https://sternnick.github.io/ai-scenario-discovery-site/ |
| Served from | the `gh-pages` branch (root of that branch) |
| Built by | the intended mechanism is a GitHub Actions workflow in `sternnick/ai-scenario-discovery` (private): it scans the history, verifies the numbers reproduce, renders the Quarto project and deploys `05_website/_site` here with `peaceiris/actions-gh-pages`. **As of 2026-10-30 that workflow cannot start a runner on this account** (Actions compute is blocked at the billing level, not here), so publishes are currently made by hand from the maintainer's workstation, running the same two checks first: gitleaks over the whole backend history, and a field-by-field comparison of the regenerated lookup against the published one. Either way, every deploy commit on `gh-pages` names the backend commit the site was rendered from - that is what makes a published table traceable to one set of parameters |
| This default branch | contains only this README, on purpose |
| Source code, data, model | not published; see the notice below |

**Theoretical scenario study. Not a forecast.** Every probability on the site is a conditional
probability under the assumptions stated on the Assumptions Register page.

## What is and is not verifiable from here

The built site is fully inspectable: the precomputed `data/scenario_lookup.json` it renders, the
parameter hash and model code hash printed beside every probability table, and the page sources
themselves are all on the `gh-pages` branch, so a reader can diff what the browser received against
what the pipeline emitted.

What is **not** public is the implementation: the transition model, the ingestion scripts, the
parameter file and the retrieved raw series live in the private backend. That is a deliberate
choice by the author, and it changes what this study can claim. It can claim that the published
numbers are internally consistent, reproducible in the sense that a pinned parameter hash and code
hash identify exactly one set of figures, and documented down to which values are observations and
which are assumptions. It cannot claim independent computational verification by a reader, because
the code is not offered for that. Anyone citing these probabilities should describe them as
reported results under a disclosed assumption set, not as a replicable result.

Requests about the source are welcome as issues on this repository; they reach the author even
though the code is not browsable.

## No source here means no source in history

Only rendered output is pushed to `gh-pages`, and nothing but this README is committed to the
default branch, so there is no commit in this repository that contains analysis code, parameter
files or retrieved data.
