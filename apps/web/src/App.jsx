import React, { useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store/index.js'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/core/Dashboard.jsx'
import HABOracle from './pages/core/HabOracle.jsx'
import HypoxiaForecast from './pages/core/HypoxiaForecast.jsx'
import WaterQuality from './pages/core/WaterQuality.jsx'
import SensorsRegistry from './pages/platform/SensorsRegistry.jsx'
import WetlandAI from './pages/wetlandai/WetlandAI.jsx'
import SITEVAULT from './pages/sitevault/SITEVAULT.jsx'
import VisionPage from './pages/platform/Vision.jsx'
import MLArchitecture from './pages/platform/MLArchitecture.jsx'
import FeedStatus from './pages/platform/FeedStatus.jsx'
import MapPage from './pages/core/MapPage.jsx'
import ScienceView from './pages/core/ScienceView.jsx'
import Intelligence from './pages/core/Intelligence.jsx'
import AlertsPage from './pages/core/Alerts.jsx'
import AIAssistant from './pages/core/AIAssistant.jsx'
import CompoundFlood from './pages/core/CompoundFlood.jsx'
import BeachSafety from './pages/core/BeachSafety.jsx'
import ClimateVulnerability from './pages/core/ClimateVulnerability.jsx'
import PollutionTracker from './pages/core/PollutionTracker.jsx'
import DataSourcesPage from './pages/platform/DataSources.jsx'
const DataStream = React.lazy(() => import('./pages/platform/DataStream.jsx'))
const MasterRoadmap = React.lazy(() => import('./pages/platform/MasterRoadmap.jsx'))

export default function App() {
  const { fetchAll, liveMode } = useStore()

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (!liveMode) return
    const interval = setInterval(fetchAll, 150_000)
    return () => clearInterval(interval)
  }, [liveMode, fetchAll])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="hab-oracle" element={<HABOracle />} />
          <Route path="hypoxia" element={<HypoxiaForecast />} />
          <Route path="water-quality" element={<WaterQuality />} />
          <Route path="sensors" element={<SensorsRegistry />} />
          <Route path="wetlandai" element={<WetlandAI />} />
          <Route path="sitevault" element={<SITEVAULT />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="map" element={<MapPage />} />
          <Route path="feeds" element={<FeedStatus />} />
          <Route path="science" element={<ScienceView />} />
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="compound-flood" element={<CompoundFlood />} />
          <Route path="beach-safety" element={<BeachSafety />} />
          <Route path="climate" element={<ClimateVulnerability />} />
          <Route path="pollution" element={<PollutionTracker />} />
          <Route path="data-sources" element={<DataSourcesPage />} />
          <Route path="data-stream" element={<Suspense fallback={<div style={{padding:40,textAlign:'center',color:'#6b7280'}}>Loading DataStream…</div>}><DataStream /></Suspense>} />
          <Route path="vision" element={<VisionPage />} />
          <Route path="roadmap" element={<Suspense fallback={<div style={{padding:40,textAlign:'center',color:'#6b7280'}}>Loading Roadmap…</div>}><MasterRoadmap /></Suspense>} />
          <Route path="ml-architecture" element={<MLArchitecture />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
