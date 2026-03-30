import { PageHeader, Section } from '../components/Common/index.jsx'

export default function MLArchitecture() {
  return (
    <div className="p-6 max-w-5xl animate-in">
      <PageHeader icon="⬢" title="ML Architecture v2.0" subtitle="Machine learning pipeline specification for TERRAWATCH" badge="RESEARCH" />

      <Section title="Architecture Overview">
        <div className="tw-card">
          <div className="text-sm text-bay-600 leading-relaxed space-y-3">
            <p>The TERRAWATCH ML Architecture v2.0 defines a multi-model ensemble approach for environmental prediction:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {[
                { name: 'CNN-LSTM HAB Predictor', desc: 'Convolutional neural network + LSTM for 8-day HAB horizon using PACE OCI datacubes (Hill et al. 2021)', priority: 'CRITICAL' },
                { name: 'BiLSTM Gap-Filler', desc: 'Bidirectional LSTM for satellite chlorophyll gap-filling during cloud cover periods', priority: 'HIGH' },
                { name: 'Bayesian Risk Engine', desc: 'Real-time risk assessment combining prior probabilities with live sensor data via Bayesian updating', priority: 'CRITICAL' },
                { name: 'Random Forest Classifier', desc: 'Multi-factor HAB species classification from spectral signatures (Karenia brevis 588nm)', priority: 'HIGH' },
                { name: 'Hypoxia LSTM', desc: 'Stratification modeling with DO₂ prediction for Jubilee event forecasting', priority: 'HIGH' },
                { name: 'WetlandAI Segmentation', desc: 'U-Net semantic segmentation for wetland boundary delineation from Sentinel-2', priority: 'MEDIUM' },
              ].map(m => (
                <div key={m.name} className="p-3 rounded-lg border border-bay-100 bg-bay-50">
                  <div className="font-semibold text-sm text-bay-800 mb-1">{m.name}</div>
                  <div className="text-xs text-bay-400 mb-2">{m.desc}</div>
                  <span className={`tw-mono text-[8px] font-bold ${m.priority === 'CRITICAL' ? 'text-red-600' : m.priority === 'HIGH' ? 'text-amber-600' : 'text-bay-400'}`}>
                    {m.priority} PRIORITY
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
