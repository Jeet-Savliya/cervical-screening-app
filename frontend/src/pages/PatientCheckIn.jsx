import { useState } from "react";
import { api } from "../api.js";

const initialState = {
  name: "",
  age: "",
  address: "",
  age_first_intercourse: "",
  residence_type: "urban",
  literate: true,
  multiple_partners: false,
  discharge: false,
  post_coital_bleeding: false,
  parity: "",
  hiv_positive: false,
  ocp_years: "",
  smoking_tobacco: false,
  immunocompromised_or_std: false,
  hpv_vaccinated: "",
  family_history_cancer: false,
  last_screening_date: "",
  last_screening_result: "",
  abnormal_bleeding_pattern: false,
  consent_given: false,
};

export default function PatientCheckIn() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startNewEntry() {
    setForm(initialState);
    setSubmitted(false);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        age: Number(form.age),
        address: form.address,
        consent_given: form.consent_given,
        risk_factors: {
          age_first_intercourse: form.age_first_intercourse ? Number(form.age_first_intercourse) : null,
          residence_type: form.residence_type,
          literate: form.literate,
          multiple_partners: form.multiple_partners,
          discharge: form.discharge,
          post_coital_bleeding: form.post_coital_bleeding,
          parity: form.parity ? Number(form.parity) : 0,
          hiv_positive: form.hiv_positive,
          ocp_years: form.ocp_years ? Number(form.ocp_years) : 0,
          smoking_tobacco: form.smoking_tobacco,
          immunocompromised_or_std: form.immunocompromised_or_std,
          hpv_vaccinated: form.hpv_vaccinated === "" ? null : form.hpv_vaccinated === "yes",
          family_history_cancer: form.family_history_cancer,
          last_screening_date: form.last_screening_date || null,
          last_screening_result: form.last_screening_result || null,
          abnormal_bleeding_pattern: form.abnormal_bleeding_pattern,
        },
      };

      await api.post("/api/patients", payload);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong submitting the form. Please let the front desk know.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="checkin-shell">
        <div className="checkin-card checkin-thankyou">
          <div className="checkin-thankyou-icon">✓</div>
          <h1>Thank you</h1>
          <p>Your information has been submitted. Please have a seat — the doctor will call you shortly.</p>
          <button className="secondary" onClick={startNewEntry}>
            This is for a different patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-shell">
      <form className="checkin-card" onSubmit={handleSubmit}>
        <h1>Patient check-in</h1>
        <p className="checkin-intro">
          Please fill this in before your consultation. Answer as accurately as you can — this
          helps your doctor plan your screening. All answers are kept confidential.
        </p>

        <div className="field">
          <label>Your full name</label>
          <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Your age</label>
            <input type="number" required value={form.age} onChange={(e) => update("age", e.target.value)} />
          </div>
          <div className="field">
            <label>Where do you live?</label>
            <select value={form.residence_type} onChange={(e) => update("residence_type", e.target.value)}>
              <option value="urban">City / town</option>
              <option value="rural">Rural / village</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Your address</label>
          <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>

        <div className="field-row">
          <div className="field">
            <label>At what age did you become sexually active?</label>
            <input
              type="number"
              value={form.age_first_intercourse}
              onChange={(e) => update("age_first_intercourse", e.target.value)}
            />
          </div>
          <div className="field">
            <label>How many times have you been pregnant?</label>
            <input type="number" value={form.parity} onChange={(e) => update("parity", e.target.value)} />
          </div>
        </div>

        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_multiple_partners"
            checked={form.multiple_partners}
            onChange={(e) => update("multiple_partners", e.target.checked)}
          />
          <label htmlFor="ci_multiple_partners">Have you had more than one sexual partner?</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_discharge"
            checked={form.discharge}
            onChange={(e) => update("discharge", e.target.checked)}
          />
          <label htmlFor="ci_discharge">Do you currently have any unusual vaginal discharge?</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_post_coital_bleeding"
            checked={form.post_coital_bleeding}
            onChange={(e) => update("post_coital_bleeding", e.target.checked)}
          />
          <label htmlFor="ci_post_coital_bleeding">Do you bleed after intercourse?</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_abnormal_bleeding_pattern"
            checked={form.abnormal_bleeding_pattern}
            onChange={(e) => update("abnormal_bleeding_pattern", e.target.checked)}
          />
          <label htmlFor="ci_abnormal_bleeding_pattern">
            Do you have irregular bleeding between periods, or after menopause?
          </label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_hiv_positive"
            checked={form.hiv_positive}
            onChange={(e) => update("hiv_positive", e.target.checked)}
          />
          <label htmlFor="ci_hiv_positive">Are you HIV positive?</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_smoking_tobacco"
            checked={form.smoking_tobacco}
            onChange={(e) => update("smoking_tobacco", e.target.checked)}
          />
          <label htmlFor="ci_smoking_tobacco">Do you smoke or use tobacco?</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_immunocompromised_or_std"
            checked={form.immunocompromised_or_std}
            onChange={(e) => update("immunocompromised_or_std", e.target.checked)}
          />
          <label htmlFor="ci_immunocompromised_or_std">
            Do you have any condition affecting your immune system, or a sexually transmitted
            infection?
          </label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="ci_family_history_cancer"
            checked={form.family_history_cancer}
            onChange={(e) => update("family_history_cancer", e.target.checked)}
          />
          <label htmlFor="ci_family_history_cancer">
            Does anyone in your family have a history of cervical or other gynecological cancer?
          </label>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Years of contraceptive pill use, if any</label>
            <input type="number" value={form.ocp_years} onChange={(e) => update("ocp_years", e.target.value)} />
          </div>
          <div className="field">
            <label>Have you had the HPV vaccine?</label>
            <select value={form.hpv_vaccinated} onChange={(e) => update("hpv_vaccinated", e.target.value)}>
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>When was your last cervical screening test, if any?</label>
            <input
              type="text"
              placeholder="e.g. 2024 or 'never'"
              value={form.last_screening_date}
              onChange={(e) => update("last_screening_date", e.target.value)}
            />
          </div>
          <div className="field">
            <label>What was the result, if you know it?</label>
            <input
              type="text"
              placeholder="e.g. normal / abnormal / not sure"
              value={form.last_screening_result}
              onChange={(e) => update("last_screening_result", e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="notice notice-danger">{error}</div>
        )}

        <div className="consent-box">
          <div className="checkbox-field" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              id="ci_consent_given"
              checked={form.consent_given}
              onChange={(e) => update("consent_given", e.target.checked)}
            />
            <label htmlFor="ci_consent_given">
              I consent to my information being stored and used by my doctor for cervical cancer
              screening purposes.
            </label>
          </div>
        </div>

        <button type="submit" disabled={submitting || !form.consent_given} style={{ width: "100%" }}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
