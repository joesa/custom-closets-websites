import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'closet-quote-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-contractor-id'?: string;
        'data-api-url'?: string;
      };
      'closet-order-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-contractor-id'?: string;
        'data-api-url'?: string;
        'data-preview-color'?: string;
      };
    }
  }
}
