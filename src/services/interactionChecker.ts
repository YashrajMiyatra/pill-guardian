import { Medication } from '../types';

export interface DrugInteractionAlert {
  id: string;
  medicationA: string;
  medicationB: string;
  severity: 'critical' | 'moderate' | 'mild';
  title: string;
  description: string;
  clinicalAdvice: string;
}

// Clinical interaction knowledge base
const KNOWN_INTERACTIONS = [
  {
    drugsA: ['lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan'],
    drugsB: ['ibuprofen', 'naproxen', 'advil', 'aleve', 'celecoxib'],
    severity: 'moderate' as const,
    title: 'ACE/ARB Inhibitor + NSAID Interaction',
    description: 'Combining blood pressure medication with NSAIDs may diminish antihypertensive efficacy and increase renal stress.',
    clinicalAdvice: 'Monitor blood pressure regularly. Consult your doctor or consider acetaminophen (paracetamol) for pain relief.',
  },
  {
    drugsA: ['metformin', 'glucophage'],
    drugsB: ['alcohol', 'contrast dye', 'furosemide'],
    severity: 'critical' as const,
    title: 'Metformin + Severe Metabolism Risk',
    description: 'Co-administration can alter lactic acid clearance, significantly increasing the risk of lactic acidosis or unexpected hypoglycemia.',
    clinicalAdvice: 'Avoid excessive alcohol. Inform radiology teams prior to contrast imaging scans.',
  },
  {
    drugsA: ['atorvastatin', 'simvastatin', 'lipitor', 'zocor'],
    drugsB: ['clarithromycin', 'erythromycin', 'grapefruit', 'diltiazem'],
    severity: 'critical' as const,
    title: 'Statin Plasma Concentration Spike',
    description: 'Inhibits CYP3A4 metabolism of statins, significantly raising blood levels and increasing risk of muscle toxicity (rhabdomyolysis).',
    clinicalAdvice: 'Report any unexplained muscle pain or weakness to your doctor immediately.',
  },
  {
    drugsA: ['albuterol', 'salbutamol', 'ventolin', 'proair'],
    drugsB: ['propranolol', 'atenolol', 'metoprolol', 'carvedilol'],
    severity: 'critical' as const,
    title: 'Bronchodilator + Beta-Blocker Antagonism',
    description: 'Beta-blockers can inhibit the bronchodilating effect of rescue inhalers and may induce severe bronchospasms in asthmatic patients.',
    clinicalAdvice: 'Consult your cardiologist and pulmonologist for cardioselective alternative medications.',
  },
  {
    drugsA: ['lisinopril', 'spironolactone'],
    drugsB: ['potassium', 'vitamin d3', 'salt substitute'],
    severity: 'moderate' as const,
    title: 'Risk of Hyperkalemia',
    description: 'ACE inhibitors reduce potassium excretion. High supplementary intake may lead to elevated serum potassium.',
    clinicalAdvice: 'Get routine serum electrolyte blood panels done as recommended by your physician.',
  },
];

export const InteractionCheckerService = {
  checkInteractions(medications: Medication[]): DrugInteractionAlert[] {
    const activeMeds = medications.filter(m => m.isActive);
    const alerts: DrugInteractionAlert[] = [];
    const checkedPairs = new Set<string>();

    for (let i = 0; i < activeMeds.length; i++) {
      for (let j = i + 1; j < activeMeds.length; j++) {
        const medA = activeMeds[i];
        const medB = activeMeds[j];
        const nameA = medA.name.toLowerCase();
        const nameB = medB.name.toLowerCase();

        const pairKey = [medA.id, medB.id].sort().join('_');
        if (checkedPairs.has(pairKey)) continue;

        for (const rule of KNOWN_INTERACTIONS) {
          const matchA = rule.drugsA.some(d => nameA.includes(d));
          const matchB = rule.drugsB.some(d => nameB.includes(d));

          const reverseMatchA = rule.drugsA.some(d => nameB.includes(d));
          const reverseMatchB = rule.drugsB.some(d => nameA.includes(d));

          if ((matchA && matchB) || (reverseMatchA && reverseMatchB)) {
            checkedPairs.add(pairKey);
            alerts.push({
              id: `alert-${pairKey}`,
              medicationA: medA.name,
              medicationB: medB.name,
              severity: rule.severity,
              title: rule.title,
              description: rule.description,
              clinicalAdvice: rule.clinicalAdvice,
            });
            break;
          }
        }
      }
    }

    return alerts;
  },
};
