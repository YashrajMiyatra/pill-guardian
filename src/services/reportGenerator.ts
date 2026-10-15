import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Medication, VitalLog, UserProfile, CaregiverContact, DoseItem } from '../types';

export const ReportGeneratorService = {
  async generateDoctorReport(
    profile: UserProfile,
    medications: Medication[],
    vitals: VitalLog[],
    caregiver: CaregiverContact,
    recentDoses: DoseItem[]
  ): Promise<void> {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const activeMeds = medications.filter(m => m.isActive);

    // Calculate adherence stats
    const totalDoses = recentDoses.length;
    const takenDoses = recentDoses.filter(d => d.status === 'taken').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>PillGuardian Clinical Summary Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 32px;
            padding: 0;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #0369a1;
            margin: 0;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .badge {
            background-color: #e0f2fe;
            color: #0284c7;
            padding: 6px 12px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 11px;
            display: inline-block;
          }
          .section {
            margin-bottom: 22px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
          }
          .card-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .card-value {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 700;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
          }
          .tag-pill {
            display: inline-block;
            background: #f1f5f9;
            color: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          .tag-critical {
            background-color: #fee2e2;
            color: #b91c1c;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .stat-banner {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }
          .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
          }
          .signature-box {
            margin-top: 24px;
            width: 260px;
            border-top: 1px solid #0f172a;
            padding-top: 6px;
            text-align: center;
            font-size: 11px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">PillGuardian™</h1>
            <div class="subtitle">Personal Medical Dossier & Medication Adherence Report</div>
          </div>
          <div>
            <span class="badge">Generated on ${today}</span>
          </div>
        </div>

        <!-- Adherence Summary Banner -->
        <div class="stat-banner">
          <div>
            <strong style="color: #166534; font-size: 14px;">Today's Medication Adherence: ${adherenceRate}%</strong>
            <div style="font-size: 11px; color: #15803d; margin-top: 2px;">
              ${takenDoses} of ${totalDoses} doses recorded on schedule.
            </div>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: #166534;">
            ${adherenceRate >= 80 ? 'EXCELLENT' : 'NEEDS ATTENTION'}
          </div>
        </div>

        <!-- Patient Demographics -->
        <div class="section">
          <div class="section-title">Patient Profile & Clinical Cautions</div>
          <div class="grid">
            <div class="card">
              <div class="card-label">Patient Name</div>
              <div class="card-value">${profile.fullName}</div>
            </div>
            <div class="card">
              <div class="card-label">Date of Birth & Blood Group</div>
              <div class="card-value">${profile.dateOfBirth} | <strong>${profile.bloodType}</strong></div>
            </div>
            <div class="card">
              <div class="card-label">Known Drug Allergies</div>
              <div class="card-value">
                ${profile.allergies.map(a => `<span class="tag-critical">${a}</span>`).join(' ')}
              </div>
            </div>
            <div class="card">
              <div class="card-label">Diagnosed Chronic Conditions</div>
              <div class="card-value">${profile.chronicConditions.join(', ')}</div>
            </div>
          </div>
        </div>

        <!-- Active Medications -->
        <div class="section">
          <div class="section-title">Active Prescription Regimen (${activeMeds.length} Medications)</div>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency / Times</th>
                <th>Instructions</th>
                <th>Remaining Supply</th>
                <th>Prescriber</th>
              </tr>
            </thead>
            <tbody>
              ${activeMeds.map(m => `
                <tr>
                  <td><strong>${m.name}</strong> <span class="tag-pill">${m.form}</span></td>
                  <td>${m.dosage}</td>
                  <td>${m.times.join(', ')}</td>
                  <td>${m.instructions}</td>
                  <td><strong>${m.stockCurrent}</strong> pills ${m.stockCurrent <= m.stockRefillAlert ? '<span style="color:#b91c1c;font-weight:bold;">(LOW)</span>' : ''}</td>
                  <td>${m.prescribedBy || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Recent Vitals -->
        <div class="section">
          <div class="section-title">Recent Clinical Vitals History</div>
          <table>
            <thead>
              <tr>
                <th>Vital Parameter</th>
                <th>Measured Value</th>
                <th>Context / Tag</th>
                <th>Recorded At</th>
                <th>Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              ${vitals.slice(0, 6).map(v => {
                let valStr = '';
                if (v.type === 'blood_pressure') {
                  valStr = `${v.value.systolic}/${v.value.diastolic} mmHg`;
                } else {
                  valStr = `${v.value.numeric} ${v.unit}`;
                }
                const isAlert = v.severity === 'alert';
                const isWarn = v.severity === 'warning';
                const color = isAlert ? '#b91c1c' : isWarn ? '#b45309' : '#0f172a';
                return `
                  <tr>
                    <td><strong>${v.type.replace('_', ' ').toUpperCase()}</strong></td>
                    <td style="color: ${color}; font-weight: bold;">${valStr}</td>
                    <td><span class="tag-pill">${v.tag || 'Standard'}</span></td>
                    <td>${new Date(v.timestamp).toLocaleDateString()} ${new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${v.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Caregiver & Primary Care Contact -->
        <div class="section">
          <div class="section-title">Care Team & Emergency Contacts</div>
          <div class="grid">
            <div class="card">
              <div class="card-label">Primary Caregiver</div>
              <div class="card-value">${caregiver.name} (${caregiver.relationship})</div>
              <div style="font-size:12px; color:#475569; margin-top:3px;">Phone: ${caregiver.phone}</div>
            </div>
            <div class="card">
              <div class="card-label">Attending Physician</div>
              <div class="card-value">${profile.primaryDoctor.name}</div>
              <div style="font-size:12px; color:#475569; margin-top:3px;">${profile.primaryDoctor.specialty} | ${profile.primaryDoctor.phone}</div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 32px;">
          <div class="signature-box">
            Physician / Reviewer Signature & Date
          </div>
        </div>

        <div class="footer">
          <div>This digital health document was compiled by PillGuardian Health Suite for patient consultation.</div>
          <div>Confidential Medical Record</div>
        </div>
      </body>
    </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share PillGuardian Medical Summary',
        });
      }
    } catch (e) {
      console.error('Error generating medical report PDF:', e);
      throw e;
    }
  },
};
