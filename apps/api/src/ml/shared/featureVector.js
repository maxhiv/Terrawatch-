export { FEATURE_KEYS, FEATURE_DEFAULTS } from '@terrawatch/shared'

const EXPECTED_COUNT = 152
import { FEATURE_KEYS as _FK } from '@terrawatch/shared'
if (_FK.length !== EXPECTED_COUNT) {
  console.warn(`[FeatureVector] WARNING: FEATURE_KEYS has ${_FK.length} keys, expected ${EXPECTED_COUNT}`)
}
