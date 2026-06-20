import * as React from "react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pixel-canvas': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'data-gap'?: number
          'data-speed'?: number
          'data-colors'?: string
          'data-variant'?: string
          'data-no-focus'?: string
        },
        HTMLElement
      >
    }
  }
}
