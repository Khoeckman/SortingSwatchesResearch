import HyperStorage from 'hyperstorage-js'
import FormValidator from './FormValidator'
import { generateRandomRGB, populateSolutions } from '..'

const defaultSettings = {
  swatchAmount: 44,
  swatchSizePx: 30,
}

export const settings = new HyperStorage<typeof defaultSettings>('swatches-settings', defaultSettings)

const settingsForm = new FormValidator(document.querySelector('.solutions form')!)

const elements = settingsForm.form.elements
const fields = {
  swatchAmount: elements.namedItem('settings-swatch-amount') as HTMLInputElement,
  swatchSizePx: elements.namedItem('settings-swatch-size') as HTMLInputElement,
}

function loadSettings() {
  for (const key of Object.keys(fields) as Array<keyof typeof fields>) {
    fields[key].value = String(settings.value[key])
  }
}

function saveSettings() {
  settings.set('swatchAmount', +fields.swatchAmount.value)
  settings.set('swatchSizePx', +fields.swatchSizePx.value)
}

function applySettings() {
  document.documentElement.style.setProperty('--swatch-size', settings.value.swatchSizePx + 'px')

  // const randomSwatches = JSON.parse(
  // '[[233,236,82],[58,90,197],[207,236,175],[2,5,1],[35,183,27],[21,131,108],[45,65,77],[243,17,18],[242,49,24],[32,143,157],[79,13,15],[79,104,236],[201,192,200],[216,27,229],[16,53,221],[201,21,79],[25,236,109],[14,214,30],[115,162,143],[214,233,45],[188,15,139],[17,183,64],[148,62,231],[122,239,192],[60,160,193],[33,58,127],[228,16,36],[208,20,97],[164,14,217],[127,148,212],[26,53,77],[18,136,118],[206,33,123],[226,203,25],[14,18,196],[62,102,209],[124,239,12],[233,182,97],[14,204,123],[151,139,169],[173,177,179],[99,240,116],[147,55,12],[109,217,198],[185,235,216],[233,18,31],[156,25,34],[229,133,12],[76,190,207],[25,27,78],[45,178,22],[111,55,237],[224,111,235],[48,20,197],[26,186,16],[190,41,87],[225,222,187],[25,48,59],[66,192,231],[143,209,233],[12,190,132],[138,56,225],[38,18,151],[51,212,70],[239,235,12],[161,23,240],[143,231,83],[24,18,113],[210,101,169],[79,53,234],[15,185,18],[96,63,236],[229,46,127],[174,42,127],[215,30,55],[233,25,127],[241,95,34],[37,30,229],[241,30,231],[181,28,193],[150,165,234],[31,35,220]]'
  // )
  const randomSwatches = generateRandomRGB(settings.value.swatchAmount)
  populateSolutions(randomSwatches)
}

loadSettings()
requestAnimationFrame(() => requestAnimationFrame(applySettings))

settingsForm.form.addEventListener('submit', (e: SubmitEvent) => {
  const form = e.target
  if (!(form instanceof HTMLFormElement)) return
  e.preventDefault()

  saveSettings()
  applySettings()
})

const updateBtn = settingsForm.form.querySelector('.actions button[name="settings-update"]')!

updateBtn.addEventListener('click', () => {
  saveSettings()
  document.documentElement.style.setProperty('--swatch-size', settings.value.swatchSizePx + 'px')
})

const resetBtn = settingsForm.form.querySelector('.actions button[name="settings-reset"]')!

resetBtn.addEventListener('click', () => {
  settings.reset()
  loadSettings()
})

// Validation

settingsForm.addValidator({
  name: 'settings-swatch-amount',
  method: (field) => +field.value >= 1 && +field.value <= 999,
  message: 'Should be between 1 and 999',
})

settingsForm.addValidator({
  name: 'settings-swatch-size',
  method: (field) => +field.value >= 1 && +field.value <= 3200,
  message: 'Should be between 1 and 3200 pixels',
})
