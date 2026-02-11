interface Field {
  field?: Element | RadioNodeList
  name: string
  message: string
}

interface Validator<T extends Field['field'] = any> extends Field {
  method: (field: T) => boolean
}

export default class FormValidator {
  errors: Field[] = []
  validators: Validator[] = []

  form: HTMLFormElement

  constructor(form: HTMLFormElement) {
    this.form = form
    this.resetSummary()

    this.form.addEventListener('submit', (event) => this.onSubmit(event))
  }

  onLoad() {
    this.resetSummary()
    this.removeInlineErrors()
  }

  onSubmit(event: SubmitEvent) {
    this.onLoad()

    if (!this.validate()) {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.showSummary()
      this.showInlineErrors()
    }
  }

  validate() {
    this.validators.forEach((validator) => {
      if (!validator.method(validator.field)) {
        // prevent multiple errors per field
        if (this.errors.map((error) => error.name).includes(validator.name)) return

        this.errors.push(validator)
      }
    })

    return this.errors.length === 0
  }

  // the field of a validator is considered an <input>-element by default
  addValidator<T extends Field['field'] = HTMLInputElement>(validator: Validator<T>) {
    const field = this.form.elements.namedItem(validator.name)
    if (!field) return

    this.validators.push({
      field,
      ...validator,
    })
  }

  createInlineError(error: Field) {
    const span = document.createElement('span')

    span.classList.add('field-error')
    span.innerText = error.message
    span.setAttribute('id', error.name + '-error')

    return span
  }

  showInlineErrors() {
    this.errors.forEach((error) => {
      const errorElement = this.createInlineError(error)

      const field = error.field

      if (field instanceof Element) {
        field.classList.add('invalid')
        field.setAttribute('aria-invalid', 'true')

        if (!('labels' in field && field.labels instanceof NodeList)) return

        const firstLabel = field.labels[0] as HTMLLabelElement
        firstLabel.insertBefore(errorElement, firstLabel.lastElementChild)
      } else if (field instanceof RadioNodeList) {
        field.forEach((el) => {
          el.classList.add('invalid')
          el.setAttribute('aria-describedby', errorElement.id)
          el.setAttribute('aria-invalid', 'true')

          const fieldSet = field[0].closest('fieldset')
          const legend = fieldSet?.querySelector('legend')

          if (legend) legend.appendChild(errorElement)
        })
      }
    })
  }

  removeInlineErrors() {
    this.form.querySelectorAll('.field-error').forEach((element) => element.remove())

    this.form.querySelectorAll('.invalid').forEach((element) => {
      element.removeAttribute('aria-describedby')
      element.removeAttribute('aria-invalid')
      element.classList.remove('invalid')
    })

    this.errors = []
  }

  resetSummary() {
    const summmary = this.form.querySelector('.error-summary') as HTMLDivElement | null
    if (!summmary) return

    summmary.style.display = 'none'
    summmary.querySelector('ul')!.innerHTML = '' // clear ul
  }

  showSummary() {
    const summmary = this.form.querySelector('.error-summary') as HTMLDivElement | null
    if (!summmary) return

    const ul = summmary.querySelector('ul')
    if (!ul) return

    // fill ul with links to the fields with an error
    this.errors.forEach((error) => {
      const a = document.createElement('a')

      // on condition the id of the field is the same as its name
      a.href = '#' + error.name
      a.innerText = error.message

      a.addEventListener('click', (event) => {
        event.preventDefault()
        const link = event.currentTarget as HTMLAnchorElement | null
        if (!link) return

        const href = link.getAttribute('href')
        if (!href) return

        const targetElement = document.querySelector(href) as HTMLElement | null
        if (!targetElement) return

        targetElement.focus()
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })

      const li = document.createElement('li')
      li.appendChild(a)
      ul.appendChild(li)
    })

    summmary.tabIndex = -1
    summmary.style.display = 'block'
    summmary.focus()
  }
}
