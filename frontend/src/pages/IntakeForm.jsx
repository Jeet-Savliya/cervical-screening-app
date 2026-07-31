import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function IntakeForm() {
  const [form, setForm] = useState(initialState);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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

      const { data: patient } = await api.post("/api/patients", payload);

      for (const file of images) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/api/patients/${patient.id}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate(`/patients/${patient.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong submitting the form. Check the backend is running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="notice">
        This form feeds a risk-screening triage tool for the doctor's review. It does not
        provide a diagnosis on its own.
      </div>
      <form onSubmit={handleSubmit}>
        <div className="section-title">Patient details</div>
        <div className="field">
          <label>Name</label>
          <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Age</label>
            <input type="number" required value={form.age} onChange={(e) => update("age", e.target.value)} />
          </div>
          <div className="field">
            <label>Residence</label>
            <select value={form.residence_type} onChange={(e) => update("residence_type", e.target.value)}>
              <option value="urban">Urban</option>
              <option value="rural">Rural</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Address</label>
          <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>

        <div className="section-title">Risk factors</div>
        <div className="field-row">
          <div className="field">
            <label>Age at first intercourse</label>
            <input
              type="number"
              value={form.age_first_intercourse}
              onChange={(e) => update("age_first_intercourse", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Parity (number of pregnancies)</label>
            <input type="number" value={form.parity} onChange={(e) => update("parity", e.target.value)} />
          </div>
        </div>

        <div className="checkbox-field">
          <input
            type="checkbox"
            id="literate"
            checked={form.literate}
            onChange={(e) => update("literate", e.target.checked)}
          />
          <label htmlFor="literate">Literate</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="multiple_partners"
            checked={form.multiple_partners}
            onChange={(e) => update("multiple_partners", e.target.checked)}
          />
          <label htmlFor="multiple_partners">Multiple sexual partners</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="discharge"
            checked={form.discharge}
            onChange={(e) => update("discharge", e.target.checked)}
          />
          <label htmlFor="discharge">Discharge present</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="post_coital_bleeding"
            checked={form.post_coital_bleeding}
            onChange={(e) => update("post_coital_bleeding", e.target.checked)}
          />
          <label htmlFor="post_coital_bleeding">Post-coital bleeding</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="hiv_positive"
            checked={form.hiv_positive}
            onChange={(e) => update("hiv_positive", e.target.checked)}
          />
          <label htmlFor="hiv_positive">HIV positive</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="smoking_tobacco"
            checked={form.smoking_tobacco}
            onChange={(e) => update("smoking_tobacco", e.target.checked)}
          />
          <label htmlFor="smoking_tobacco">Smoking / tobacco use</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="immunocompromised_or_std"
            checked={form.immunocompromised_or_std}
            onChange={(e) => update("immunocompromised_or_std", e.target.checked)}
          />
          <label htmlFor="immunocompromised_or_std">Other immunocompromised condition / STD</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="family_history_cancer"
            checked={form.family_history_cancer}
            onChange={(e) => update("family_history_cancer", e.target.checked)}
          />
          <label htmlFor="family_history_cancer">Family history of cervical/gynecologic cancer</label>
        </div>
        <div className="checkbox-field">
          <input
            type="checkbox"
            id="abnormal_bleeding_pattern"
            checked={form.abnormal_bleeding_pattern}
            onChange={(e) => update("abnormal_bleeding_pattern", e.target.checked)}
          />
          <label htmlFor="abnormal_bleeding_pattern">Abnormal bleeding pattern (intermenstrual/post-menopausal)</label>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Years of OCP (oral contraceptive) use</label>
            <input type="number" value={form.ocp_years} onChange={(e) => update("ocp_years", e.target.value)} />
          </div>
          <div className="field">
            <label>HPV vaccinated</label>
            <select value={form.hpv_vaccinated} onChange={(e) => update("hpv_vaccinated", e.target.value)}>
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Last screening date (if any)</label>
            <input
              type="text"
              placeholder="e.g. 2024-03"
              value={form.last_screening_date}
              onChange={(e) => update("last_screening_date", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Last screening result</label>
            <input
              type="text"
              placeholder="e.g. normal / abnormal"
              value={form.last_screening_result}
              onChange={(e) => update("last_screening_result", e.target.value)}
            />
          </div>
        </div>

        <div className="section-title">Referral photos</div>
        <div className="field">
          <label>Upload cervix/colposcopy photo(s) provided for referral</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files))} />
        </div>

        {error && <div className="notice" style={{ background: "#fee2e2", borderColor: "#fecaca", color: "#991b1b" }}>{error}</div>}

        <div className="consent-box">
          <div className="checkbox-field" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              id="consent_given"
              checked={form.consent_given}
              onChange={(e) => update("consent_given", e.target.checked)}
            />
            <label htmlFor="consent_given">
              The patient consents to their information and photos being stored and used for
              cervical cancer screening purposes.
            </label>
          </div>
        </div>

        <button type="submit" disabled={submitting || !form.consent_given}>
          {submitting ? "Submitting..." : "Submit intake form"}
        </button>
        {!form.consent_given && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Patient consent is required before this form can be submitted.
          </p>
        )}
      </form>
    </div>
  );
}
