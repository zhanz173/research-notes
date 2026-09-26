
Clinical EEG reports rarely behave like the clean binary labels we use to train machine-learning models. A neurologist may describe an EEG as clearly normal, probably normal, suspicious but not definitive, or clearly abnormal. When we reduce all of this language to **normal vs. abnormal**, we throw away something potentially important: how clear the evidence appeared to the reader.

In our dataset, we used [LLMs to interpret the EEG report](https://doi.org/10.64898/2026.07.07.26357190) and gave a four-level score from normal to abnormal: 1 — confident normal → 2 — low-confidence normal → 3 — low-confidence abnormal → 4 — confident abnormal

What makes an LLM give an uncertain classification to the EEG report? There are at least two explanations. 
- The report label may be an uncertain observation of an otherwise clear EEG. In that case, low-confidence recordings should often sit deep inside one of the two clear feature regions, sometimes on the side opposite the report. 
- Alternatively, the EEG evidence itself may be borderline. Those recordings should concentrate near the normal–abnormal boundary, with neighbors from both confident groups. 

We tested these hypothesis using **35,946 six-minute EEGs from 33,631 patients** with frozen [LaBraM](https://github.com/935963004/LaBraM) and [REVE](https://arxiv.org/abs/2510.21585) features.  Each EEG was segmented into 90 nonoverlapping four-second windows and the features are extracted per-window. We averaged the windows for recording-level probes, while retaining the full window sequences for representational similarity.

## First, do LaBraM and REVE see the same EEG structure?

Both LaBraM and REVE are transformer-based encoder with identical architectural design training strategy. This makes an interest question whether: whether two features capture identical EEG information?

We used the original [linear CKA framework](https://proceedings.mlr.press/v97/kornblith19a.html) for the mean feature comparison, and a [debiased estimator](https://arxiv.org/abs/2405.01012) for the 90-window comparison, where the feature dimensions exceed the number of windows. Across all recordings, linear centered kernel alignment (CKA) between their **mean** EEG embeddings was 0.590. This indicates appreciable shared across-recording geometry. Within a recording, however, debiased linear CKA between the two aligned sequences of 90 windows had medians of 0.226, 0.248, 0.259, and 0.265 for scores 1 through 4. A shuffled-window reference had median **−0.003**. The within-recording analysis used 500 EEGs per score, with one EEG per patient within each score group.

![Full-dimensional and PCA-reduced LaBraM–REVE CKA by report score](certainty_cka_pca_sensitivity.png)

The within-EEG result was initially computed using all 200/512 feature dimensions. Because 90 windows are fewer than the feature dimensions, we repeated it after **per-EEG** PCA to the global effective rank (13 for LaBraM and 27 for REVE components). The reduced components retained median temporal variance of approximately 84% for LaBraM and 89% for REVE.  The overall median debiased CKA changed only from 0.249 to 0.247; the paired values correlate at 0.9999. 

LaBraM and REVE agree more about recordings than about moments within a recording. Both features seem to capture considerable inter-subject variability after averaging out within-EEG variance. This also highlights the importance of [cross-subject control](https://arxiv.org/pdf/2405.17024).

## Report confidence is partly visible in the EEG representation

Before asking where uncertain EEGs lie, we checked whether the representations contained any information about the four report groups at all. We trained simple linear probes on top of the frozen EEG features.

In Temple University dataset (TUBA) LaBraM achieved AUC of 0.814 vs. 0.832 for REVE, which was surprisingly close to our evaluation on our private dataset. Every result below is held out by patient, using the same three folds for LaBraM and REVE. Within-class confidence probes were trained independently: 1 vs 2 among normal-labeled EEGs, and 3 vs 4 among abnormal-labeled EEGs.

The results show that report label is partly recoverable from the frozen EEG features. All EEG-feature probes exceed a baseline trained on age, sex, hospital, and admission status using the same patient splits. The pooled confidence is used to detect whether 'confidence' is a feature on its own. The weaker results suggest against independent features separating confident and low-confidence EEGs . 

![Direct linear probes of report score groupings](EEG_report_confidence/certainty_direct_groupings.png)

| Grouping                                 | Age, sex, hospital, admission AUC | LaBraM AUC | REVE AUC |
| ---------------------------------------- | --------------------------------: | ---------: | -------: |
| Binary status, 1–2 vs 3–4                |                             0.691 |      0.817 |    0.835 |
| Confidence among normal labels, 1 vs 2   |                             0.617 |      0.672 |    0.676 |
| Confidence among abnormal labels, 3 vs 4 |                             0.635 |      0.681 |    0.682 |
| Pooled confidence, 2–3 vs 1–4            |                             0.554 |      0.614 |    0.618 |

## Where do uncertain EEGs fall relative to clear cases?

For the main test, we trained a normal–abnormal anchor probe using **only scores 1 and 4** from training patients. Scores 2 and 3 were excluded from its fitting and calibration. On held-out patients, the anchor probe separated confident scores 1 vs 4 with AUC 0.883 for LaBraM and 0.898 for REVE. Its discrimination of uncertain scores 2 vs 3 was lower: 0.653 and 0.672, respectively. This difference alone does not distinguish noise from borderline evidence, but the position of the uncertain EEGs is informative.

Scores 2 and 3 shift toward the anchor boundary on both feature sets. Their neighbors are also more mixed between confident normal and confident abnormal EEGs. In REVE, the median held-out logistic anchor score (in calibration standard-deviation units) progresses from approximately −0.53 → −0.23 → 0.16 → 0.71 across scores 1–4; LaBraM shows the same ordering. Relative to the same-side confident score, patient-bootstrapped differences in mean local mixing are 0.094 (95% interval 0.086–0.101) for score 2 vs 1 and 0.091 (0.081–0.102) for score 3 vs 4 in REVE. LaBraM gives 0.069 and 0.072, respectively. Smaller absolute classifier margins and greater local mixing remain after adjustment for age, sex, hospital, and admission status.

The uncertain EEGs are usually near *individual* confident EEGs in the 32-component PCA space: approximately 94–96% of scores 2 and 3 have an average distance to their 31 nearest score-1-or-4 training EEGs below the confident-calibration cutoff. “Near” can mean near score-1 examples, score-4 examples, or a mix of both. In summary, low-confidence EEGs are not predominantly far outside this pooled reference neighborhood.

![Held-out anchor scores, neighbor mixing, and confident-reference support](EEG_report_confidence/certainty_anchor_probe.png)

*Figure guide:* The top panels show the logistic decision score divided by the standard deviation of confident calibration scores; zero is the normal–abnormal boundary. For each held-out EEG, we find its 31 nearest individual confidently-rated **training** EEGs, pooled across both labels, in 32-component PCA space. The bottom-left index measures how mixed those neighbors' labels are: zero means all have one label, and one means an even mix. The bottom-right panel uses the average distance to those same 31 individual EEGs; its cutoff is the 95th percentile of that average distance among separate, patient-disjoint confident calibration EEGs.

## Most uncertain EEGs are not isolated outliers

Another possibility was that low-confidence reports correspond to unusual EEGs outside the feature manifold. We checked PCA and clustering as descriptive views of the confident-reference feature cloud. PCA was fitted only on confident training EEGs, then all four held-out score groups were projected into it. The first 32 components explained approximately 97% of confident LaBraM variance and 94% of confident REVE variance. The left-column plots display only the first two components, which explain 59.6% and 38.8% of confident LaBraM and REVE variance, respectively. They show extensive overlap, but a two-dimensional view alone cannot establish whether any group is outside the full feature cloud.

An unsupervised two-cluster fit to confident (scores 1 vs 4) EEGs did not show two clean diagnostic islands: its adjusted Rand index was approximately 0.006 for LaBraM and 0.243 for REVE. The dominate variance thus does not point to an EEG abnormality direction.

The nearest-neighbor check also gives no evidence that low-confidence EEGs are predominantly outside the observed confident feature cloud: 95.6% of score-2 and 94.4% of score-3 REVE EEGs fall within the confident-calibration distance cutoff, with similarly high rates in LaBraM. The conclusion favors that scores 2 and 3 have more intermediate features while usually remaining near actual confident examples in the manifold space. Although we could not show a literal interpolation path from score-1 to score-4.

![PCA view and held-out logistic anchor score versus confident-reference distance](EEG_report_confidence/certainty_manifold_pca.png)

*Figure guide:* In this figure, each dot is a held-out EEG; The right-column horizontal axis is the logistic anchor score: negative favors normal, positive favors abnormal, and zero is its decision boundary. The vertical axis is mean distance to 31 confident training EEGs, divided by the confident-calibration cutoff; points below one are within that reference distance. 

## Not every uncertain EEG looks borderline

The anchor probe was trained only on confident normal (score-1) and confident abnormal (score-4) EEGs from other patients. For each held-out EEG, we asked two questions: which binary side does this probe predict, and how many of its 31 nearest confident training EEGs in the 32-component PCA space are abnormal? Both patterns below also require the EEG's mean neighbor distance to fall within a cutoff set at the 95th percentile of confident calibration EEGs.

- **Possible borderline EEGs (left panel):** The probe's absolute decision score is in the lowest quarter of confident calibration margins, and 7–24 of 31 neighbors are confident abnormal. This shows the percentage of low margin and with a mixed neighborhood samples, not classification accuracy ; 
- **Possible mislabeled EEGs (right panel):** The margin is *above* that lowest-quarter cutoff; the neighborhood is one-sided (0–6 or 25–31 of 31 neighbors are confident abnormal); and both the probe and the neighbor majority point to the binary side opposite the report. This shows the percentage of high margin but with a conflicting neighborhood samples.  

For example, a score-2 EEG is reported as low-confidence *normal*. It enters the right panel if the probe predicts *abnormal* and at least 25 of its 31 confident neighbors are abnormal. 

![Share of EEGs flagged as possibly borderline or mislabeled, by report score](EEG_report_confidence/certainty_signatures.png)

*Figure guide:* Each bar is the percentage of all held-out EEGs at that report score flagged by the rule, not the probability that an EEG is truly borderline or mislabeled; blue is LaBraM and red is REVE. The two patterns do not cover every EEG. The possible-borderline pattern is higher in low-confidence groups. The possible-mislabeling pattern is less common, but it too increases in low-confidence groups. This subgroup is consistent with noisy labels, but it does not prove them. A finding elsewhere in the full clinical EEG could be missing from the selected six minutes; the frozen representation or linear probe might also overlook a real finding.

## What can we conclude?

Taken together, the results do not support a single explanation for uncertain EEG reports.

A substantial fraction of low-confidence recordings look borderline in representation space. Scores 2 and 3 are enriched near the confident-case boundary, have more mixed neighbors, but mostly remain in the local feature neighborhood. The KNN probe among low-confidence group shows a stronger disagreement between the report and the frozen EEG features. Both patterns appear with LaBraM and REVE. 

Low-confidence clinical labels may not simply be bad labels that should be cleaned away. Some may identify recordings where the underlying evidence is genuinely less separable. Others may identify disagreements arising from human reporting errors or weakness in EEG foundation models.

However, the implication of current feature-space analysis is limited. A decisive experiment would be to return to the EEGs themselves.  Multiple neurologists would be needed for true diagnostic uncertainty study. Until then, “borderline” and “noisy” remain hypotheses about the nature of low-confidence samples.
