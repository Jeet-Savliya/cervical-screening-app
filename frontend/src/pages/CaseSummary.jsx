import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";

export default function CaseSummary() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [review, setReview] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: p } = await api.get(`/api/patients/${patientId}`);
      setPatient(p);
      try {
        const { data: r } = await api.get(`/api/patients/${patientId}/review`);
        setReview(r);
      } catch {
        setReview(null);
      }
    }
    load();
  }, [patientId]);

  if (!patient) return <div className="card">Loading summary...</div>;

  const rf = patient.risk_factor;
  const generatedAt = new Date().toLocaleString();

  return (
    <div className="summary-page">
      <div className="summary-toolbar no-print">
        <Link to={`/patients/${patientId}`} className="secondary-link">
          &larr; Back to case
        </Link>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="summary-sheet">
        <div className="summary-header">
          <h1>Cervical Cancer Risk Screening — Summary</h1>
          <p className="summary-meta">Generated {generatedAt}</p>
        </div>

        <section className="summary-section">
          <h2>Patient details</h2>
          <table className="summary-table">
            <tbody>
              <tr>
                <td>Name</td>
                <td>{patient.name}</td>
              </tr>
              <tr>
                <td>Age</td>
                <td>{patient.age}</td>
              </tr>
              <tr>
                <td>Address</td>
                <td>{patient.address || "—"}</td>
              </tr>
              <tr>
                <td>Intake recorded</td>
                <td>{new Date(patient.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Consent on file</td>
                <td>
                  {patient.consent_given
                    ? `Yes${patient.consent_at ? " — " + new Date(patient.consent_at).toLocaleDateString() : ""}`
                    : "Not recorded"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {review?.red_flag_symptoms?.length > 0 && (
          <section className="summary-section summary-alert">
            <h2>Recommend clinical exam regardless of risk score</h2>
            <p>Symptom(s) present: {review.red_flag_symptoms.join(", ")}.</p>
          </section>
        )}

        <section className="summary-section">
          <h2>Background risk assessment</h2>
          {review?.risk_level ? (
            <>
              <p>
                Risk score: <strong>{review.risk_score}</strong> &nbsp;·&nbsp; Risk level:{" "}
                <strong>{review.risk_level}</strong>
              </p>
              {review.risk_factors_detail?.length > 0 && (
                <>
                  <p className="summary-subhead">Contributing factors:</p>
                  <ul>
                    {review.risk_factors_detail.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p>No risk assessment recorded.</p>
          )}
        </section>

        {rf && (
          <section className="summary-section">
            <h2>Recorded risk factors</h2>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Residence</td>
                  <td>{rf.residence_type || "—"}</td>
                </tr>
                <tr>
                  <td>Age at first intercourse</td>
                  <td>{rf.age_first_intercourse ?? "—"}</td>
                </tr>
                <tr>
                  <td>Parity</td>
                  <td>{rf.parity}</td>
                </tr>
                <tr>
                  <td>Multiple sexual partners</td>
                  <td>{rf.multiple_partners ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Discharge present</td>
                  <td>{rf.discharge ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Post-coital bleeding</td>
                  <td>{rf.post_coital_bleeding ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>HIV positive</td>
                  <td>{rf.hiv_positive ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Years of OCP use</td>
                  <td>{rf.ocp_years}</td>
                </tr>
                <tr>
                  <td>Smoking / tobacco use</td>
                  <td>{rf.smoking_tobacco ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Other immunocompromised / STD</td>
                  <td>{rf.immunocompromised_or_std ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>HPV vaccinated</td>
                  <td>{rf.hpv_vaccinated === null ? "Unknown" : rf.hpv_vaccinated ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Family history of cervical/gynecologic cancer</td>
                  <td>{rf.family_history_cancer ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Abnormal bleeding pattern</td>
                  <td>{rf.abnormal_bleeding_pattern ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Last screening</td>
                  <td>
                    {rf.last_screening_date || "—"}
                    {rf.last_screening_result ? ` (${rf.last_screening_result})` : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        <section className="summary-section">
          <h2>VIA comparison finding</h2>
          <p>{review?.via_finding || "No finding recorded yet."}</p>
        </section>

        <section className="summary-section">
          <h2>Doctor's notes</h2>
          <p className="summary-notes">{review?.doctor_notes || "—"}</p>
        </section>

        <p className="summary-disclaimer">
          This summary is generated from a risk-screening decision-support tool and reflects the
          reviewing doctor's own clinical judgement. It is not an automated diagnosis and does not
          replace confirmatory testing (Pap smear, HPV testing, colposcopy, or biopsy) where
          clinically indicated.
        </p>
      </div>
    </div>
  );
}
