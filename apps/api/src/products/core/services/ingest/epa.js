import axios from 'axios'

const ECHO_BASE = 'https://echo.epa.gov/echo'

export async function getMobileBayNPDESFacilities() {
  try {
    const { data } = await axios.get(`${ECHO_BASE}/cwa_rest_services.get_facilities`, {
      params: {
        output: 'JSON',
        p_st: 'AL',
        p_county: '01003,01097',
        p_act: 'Y',
        p_ptype: 'NPD',
        qcolumns: '1,3,4,5,6,7,8,12,13,22,23',
      },
      timeout: 12000,
    })

    const facilities = (data?.Results?.Facilities || []).map(f => ({
      id: f.RegistryID,
      name: f.FacilityName,
      address: `${f.LocationAddress}, ${f.CityName}, ${f.StateCode}`,
      lat: parseFloat(f.Latitude83) || null,
      lon: parseFloat(f.Longitude83) || null,
      permitId: f.CWAIDs,
      type: f.SICCodes,
      inspectionCount: parseInt(f.InspectionCount) || 0,
      violationCount: parseInt(f.AllProgramsWithViolations) || 0,
      hasViolation: f.AllProgramsWithViolations > 0,
    }))

    return {
      available: true,
      facilities,
      count: facilities.length,
      violating: facilities.filter(f => f.hasViolation).length,
      source: 'EPA ECHO — NPDES Compliance Database',
      note: 'Active NPDES discharge permits in Baldwin and Mobile Counties',
    }
  } catch (err) {
    console.error('[EPA ECHO]', err.message)
    return { available: false, error: err.message }
  }
}

const WQP_BASE = 'https://www.waterqualitydata.us/data'

export async function getWQPResults(params = {}) {
  try {
    const { data } = await axios.get(`${WQP_BASE}/Result/search`, {
      params: {
        bBox: '-88.8,30.0,-87.5,31.2',
        characteristicName: params.characteristic || 'Dissolved oxygen (DO)',
        startDateLo: params.startDate || new Date(Date.now() - 7*86400000).toISOString().split('T')[0],
        startDateHi: new Date().toISOString().split('T')[0],
        mimeType: 'json',
        dataProfile: 'resultPhysChem',
        ...params,
      },
      timeout: 15000,
    })

    return {
      available: true,
      results: (data || []).slice(0, 100).map(r => ({
        station: r.MonitoringLocationIdentifier,
        stationName: r.MonitoringLocationName,
        characteristic: r.CharacteristicName,
        value: parseFloat(r.ResultMeasureValue),
        unit: r['ResultMeasure/MeasureUnitCode'],
        date: r.ActivityStartDate,
        lat: parseFloat(r.LatitudeMeasure),
        lon: parseFloat(r.LongitudeMeasure),
        organization: r.OrganizationIdentifier,
      })).filter(r => !isNaN(r.value)),
      count: Array.isArray(data) ? data.length : 0,
      source: 'Water Quality Portal — USGS + EPA + State databases unified',
    }
  } catch (err) {
    console.error('[WQP]', err.message)
    return { available: false, error: err.message }
  }
}

export async function getWQPDO2() {
  try {
    const result = await getWQPResults({
      characteristic: 'Dissolved oxygen (DO)',
      startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    })
    if (!result.available || !result.results?.length) return null
    const doValues = result.results
      .filter(r => r.characteristic === 'Dissolved oxygen (DO)' && r.value != null)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    if (doValues.length === 0) return null
    return doValues[0].value
  } catch (err) {
    console.error('[WQP DO2]', err.message)
    return null
  }
}

const AIRNOW_BASE = 'https://www.airnowapi.org/aq'

export async function getMobileAQI() {
  const key = process.env.AIRNOW_API_KEY
  if (!key) return {
    available: false, configured: false,
    message: 'AirNow API key not configured',
    setup: 'Register free at airnowapi.org',
  }

  try {
    const { data } = await axios.get(`${AIRNOW_BASE}/observation/zipCode/current/`, {
      params: {
        zipCode: '36528',
        distance: 50,
        API_KEY: key,
        format: 'application/json',
      },
      timeout: 8000,
    })

    return {
      available: true,
      configured: true,
      readings: (data || []).map(r => ({
        parameter: r.ParameterName,
        aqi: r.AQI,
        category: r.Category?.Name,
        reportingArea: r.ReportingArea,
        stateCode: r.StateCode,
        timestamp: `${r.DateObserved} ${r.HourObserved}:00`,
      })),
      source: 'AirNow — EPA air quality monitoring network',
    }
  } catch (err) {
    console.error('[AirNow]', err.message)
    return { available: false, configured: true, error: err.message }
  }
}

export async function getTRIFacilities() {
  try {
    const { data } = await axios.get(
      'https://data.epa.gov/efservice/TRI_FACILITY/STATE_ABBR/AL/COUNTY_NAME/MOBILE/JSON',
      { timeout: 10000 }
    )
    return {
      available: true,
      facilities: (data || []).map(f => ({
        name: f.FACILITY_NAME,
        address: f.STREET_ADDRESS,
        city: f.CITY_NAME,
        lat: parseFloat(f.LATITUDE) || null,
        lon: parseFloat(f.LONGITUDE) || null,
        naics: f.PRIMARY_NAICS_CODE,
        industry: f.INDUSTRY_SECTOR,
      })),
      count: (data || []).length,
      source: 'EPA Envirofacts — Toxic Release Inventory',
      note: 'Facilities required to report toxic chemical releases',
    }
  } catch (err) {
    return { available: false, error: err.message }
  }
}
