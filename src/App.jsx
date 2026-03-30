import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store/index.js'
import Layout from './components/Layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HABOracle from './pages/HabOracle.jsx'
import HypoxiaForecast from './pages/HypoxiaForecast.jsx'
import WaterQuality from './pages/WaterQuality.jsx'
import SensorsRegistry from './pages/SensorsRegistry.jsx'
import WetlandAI from './pages/WetlandAI.jsx'
import SITEVAULT from './pages/SITEVAULT.jsx'
import VisionPage from './pages/Vision.jsx'
import MLArchitecture from './pages/MLArchitecture.jsx'
import FeedStatus from './pages/FeedStatus.jsx'
import MapPage from './pages/MapPage.jsx'
import ScienceView from './pages/ScienceView.jsx'
import Intelligence from './pages/Intelligence.jsx'
import AlertsPage from './pages/Alerts.jsx'
import AIAssistant from './pages/AIAssistant.jsx'

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
          <Route path="vision" element={<VisionPage />} />
          <Route path="ml-architecture" element={<MLArchitecture />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
