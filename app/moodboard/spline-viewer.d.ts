import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url?: string;
          loading?: string;
          "events-target"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
