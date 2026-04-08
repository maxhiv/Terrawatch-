import axios from 'axios'

const ECHO_BASE = 'https://echo.epa.gov/rest/services/cws'

export async function fetchNPDESFacilities() {
  const { data: json } = await axios.get(`${ECHO_BASE}/facilities/search/facilities`, {
    params: {
      output:       'JSON',
      p_st:         'AL',
      p_huc8:       '03160203,03160201,03160110,03160109',
      p_ftype:      'POW',
      p_act:        'Y',
      p_permstatus: 'E',
      qcolumns:     '1,3,4,5,6,7,8,9,13,14,23',
      responseset:  '100',
    },
    headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0' },
    timeout: 20000,
  })

  return (json.Results?.Facilities ?? []).map(f => ({
    npdes_id:      f.RegistryID,
    permit_id:     f.FacilityName,
    name:          f.FacilityName,
    address:       `${f.LocationAddress}, ${f.City}, ${f.State}`,
    lat:           parseFloat(f.Latitude84),
    lon:           parseFloat(f.Longitude84),
    permit_status: f.PermitStatusCode,
    facility_type: f.CWPFacilityTypeIndicator,
    permit_expiry: f.PermitExpDate,
  })).filter(f => !isNaN(f.lat) && !isNaN(f.lon))
}

export async function fetchWatershedNutrientLoading() {
  const summary = {
    source:     'epa_echo',
    timestamp:  new Date().toISOString(),
    facilities: [],
    exceedances: [],
    flags:      [],
  }

  try {
    const { data: json } = await axios.get(`${ECHO_BASE}/facilities/search/facilities`, {
      params: {
        output:        'JSON',
        p_st:          'AL',
        p_co:          'MOBILE,WASHINGTON,CLARKE,MARENGO,DALLAS',
        p_ftype:       'POW',
        p_act:         'Y',
        responseset:   '50',
        qcolumns:      '1,3,4,5,6,7,8',
      },
      headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0' },
      timeout: 20000,
    })

    const facilities = json.Results?.Facilities ?? []

    summary.facilities = facilities.slice(0, 20).map(f => ({
      name:     f.FacilityName,
      city:     f.City,
      lat:      parseFloat(f.Latitude84),
      lon:      parseFloat(f.Longitude84),
      permit:   f.PermitStatusCode,
    })).filter(f => !isNaN(f.lat))

    summary.facility_count = facilities.length
  } catch (err) {
    summary.error = err.message
  }

  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 6)  summary.flags.push('SPRING_LOADING_SEASON')
  if (month >= 6 && month <= 9)  summary.flags.push('SUMMER_BLOOM_SEASON')

  return summary
}
