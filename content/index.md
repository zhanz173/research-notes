---
title: Mostly about EEG
description: Notes
cssclasses:
  - research-home
---
## About me

I am a machine learning engineer / software engineer working at the intersection of **machine learning, biomedical signal processing, and scientific computing**.

I am currently completing an MSc at Simon Fraser University, where my research focuses on machine learning for large-scale clinical EEG data. My work includes representation learning, ordinal prediction, signal processing, and modeling uncertainty in routine clinical data.

Previously, I worked at Huawei Technologies on production C/C++ software. I am interested in machine learning engineering, research development, and biomedical AI roles where I can work across modeling, data, and software systems.

---
## About This Site

This site is a collection of projects, experiments, and technical notes from my unpublished work in master's program and  ideas.

Some pages document completed research projects, while others explore ideas that did not become formal publications but were still useful technically. I use these pages to record how I approach problems, implement methods from papers, test hypotheses, and understand why particular approaches do or do not work.

The site is written primarily in Obsidian and published as an interconnected set of notes, so individual projects may link to more detailed experiments, implementation notes, and related ideas.

---

## Projects

### Are uncertain EEG reports noisy labels or borderline signals?

**EEG · classification · uncertainty · 2026**

Whether low-confidence EEG reports reflect noisy labels or genuinely borderline EEG evidence.
Using frozen LaBraM and REVE representations, we found that uncertain cases tend to sit closer to the normal–abnormal decision boundary and have more mixed neighborhoods of confident normal and abnormal EEGs. At the same time, a smaller subset shows strong disagreement between the report and the surrounding feature-space evidence suggesting label noise.

[[Are uncertain EEG reports noisy labels or borderline signals|Read the experiment →]]

---
### EEG classification better needs control studies

**EEG · classification · 2025**

An experiment comparing pretrained EEG representations with spectral features raises a more difficult question: what is the classifier actually learning? This note explores why promising discrimination needs stronger controls before it can support disease-specific claims.

[[EEG classification better needs control studies|Read the experiment →]]
