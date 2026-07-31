"""
Cervical cancer background risk score.

============================================================================
HOW TO CHANGE THE SCORING (read this first)
============================================================================
Every point value used below lives in the POINTS dictionary right underneath
this comment. To change how much a factor counts, just change the number
next to it — nothing else in this file needs to be touched.

The current numbers are a reasonable starting point, not a finished,
clinically validated scoring system. The plan is for the gynecologist to
review each value herself and adjust it based on her own clinical judgement
and what she sees in her patient population — that's expected and normal.

Thresholds for Low / Medium / High are set further down, in
THRESHOLD_MEDIUM and THRESHOLD_HIGH — also just plain numbers to edit.
"""

from typing import List, Tuple

from .models import RiskFactor

# ---------------------------------------------------------------------------
# EDIT THESE NUMBERS to change how much each factor contributes to the score.
# ---------------------------------------------------------------------------
POINTS = {
    "early_age_first_intercourse": 2,   # age at first intercourse <= 17
    "multiple_partners": 2,
    "high_parity": 3,                   # 3 or more births
    "smoking_tobacco": 2,
    "ocp_5_to_9_years": 3,               # oral contraceptive use, 5-9 years
    "ocp_10_plus_years": 4,              # oral contraceptive use, 10+ years
    "hiv_positive": 5,
    "prior_abnormal_screening": 5,       # a past Pap/HPV test came back abnormal
}

# ---------------------------------------------------------------------------
# EDIT THESE to change where Low/Medium/High risk starts.
# A total score at or above THRESHOLD_HIGH is "High"; at or above
# THRESHOLD_MEDIUM (but below THRESHOLD_HIGH) is "Medium"; anything lower
# is "Low".
# ---------------------------------------------------------------------------
THRESHOLD_MEDIUM = 6
THRESHOLD_HIGH = 12


def compute_background_risk(rf: RiskFactor) -> Tuple[int, str, List[str]]:
    """
    Adds up POINTS for whichever factors apply to this patient, then maps
    the total to Low / Medium / High using the thresholds above.
    Returns (score, level, contributing_factors).
    """
    score = 0
    contributing = []

    if rf.age_first_intercourse is not None and rf.age_first_intercourse <= 17:
        score += POINTS["early_age_first_intercourse"]
        contributing.append(f"Early age at first intercourse (+{POINTS['early_age_first_intercourse']})")

    if rf.multiple_partners:
        score += POINTS["multiple_partners"]
        contributing.append(f"Multiple sexual partners (+{POINTS['multiple_partners']})")

    if rf.parity and rf.parity >= 3:
        score += POINTS["high_parity"]
        contributing.append(f"High parity, 3+ births (+{POINTS['high_parity']})")

    if rf.smoking_tobacco:
        score += POINTS["smoking_tobacco"]
        contributing.append(f"Current smoking/tobacco use (+{POINTS['smoking_tobacco']})")

    if rf.ocp_years:
        if rf.ocp_years >= 10:
            score += POINTS["ocp_10_plus_years"]
            contributing.append(f"Oral contraceptive use, 10+ years (+{POINTS['ocp_10_plus_years']})")
        elif rf.ocp_years >= 5:
            score += POINTS["ocp_5_to_9_years"]
            contributing.append(f"Oral contraceptive use, 5-9 years (+{POINTS['ocp_5_to_9_years']})")
        # under 5 years: not scored

    if rf.hiv_positive:
        score += POINTS["hiv_positive"]
        contributing.append(f"HIV positive (+{POINTS['hiv_positive']})")

    if rf.last_screening_result and "abnormal" in rf.last_screening_result.lower():
        score += POINTS["prior_abnormal_screening"]
        contributing.append(f"Prior abnormal screening result (+{POINTS['prior_abnormal_screening']})")

    if score >= THRESHOLD_HIGH:
        level = "High"
    elif score >= THRESHOLD_MEDIUM:
        level = "Medium"
    else:
        level = "Low"

    return score, level, contributing


def get_red_flag_symptoms(rf: RiskFactor) -> List[str]:
    """
    Symptoms suggestive of disease that may already be present. These should
    prompt a direct clinical exam regardless of the background risk score,
    so they are deliberately kept separate from the score above rather than
    added into it.
    """
    flags = []
    if rf.post_coital_bleeding:
        flags.append("Post-coital bleeding")
    if rf.discharge:
        flags.append("Abnormal discharge")
    if rf.abnormal_bleeding_pattern:
        flags.append("Abnormal bleeding pattern")
    return flags


def get_informational_flags(rf: RiskFactor) -> List[str]:
    """
    Factors worth the doctor's attention but not currently scored --
    shown for context only.
    """
    flags = []
    if rf.immunocompromised_or_std:
        flags.append("Immunocompromised / STD history")
    if rf.hpv_vaccinated is False:
        flags.append("Not HPV vaccinated")
    if rf.family_history_cancer:
        flags.append("Family history of cancer")
    return flags


def compute_risk_score(rf: RiskFactor):
    """
    Backward-compatible entry point used by the patients router.
    Returns (score, level) from the background risk score alone; red flags
    and informational flags are computed separately and stored on CaseReview.
    """
    score, level, _ = compute_background_risk(rf)
    return score, level
