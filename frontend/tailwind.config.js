/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      extend: {
        fontFamily: { sans: ["Geist Sans", ...defaultTheme.fontFamily.sans] },
        keyframes: {
          hide: {
            from: { opacity: "1" },
            to: { opacity: "0" },
          },
          slideDownAndFade: {
            from: { opacity: "0", transform: "translateY(-6px)" },
            to: { opacity: "1", transform: "translateY(0)" },
          },
          slideLeftAndFade: {
            from: { opacity: "0", transform: "translateX(6px)" },
            to: { opacity: "1", transform: "translateX(0)" },
          },
          slideUpAndFade: {
            from: { opacity: "0", transform: "translateY(6px)" },
            to: { opacity: "1", transform: "translateY(0)" },
          },
          slideRightAndFade: {
            from: { opacity: "0", transform: "translateX(-6px)" },
            to: { opacity: "1", transform: "translateX(0)" },
          },
          accordionOpen: {
            from: { height: "0px" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          accordionClose: {
            from: {
              height: "var(--radix-accordion-content-height)",
            },
            to: { height: "0px" },
          },
          dialogOverlayShow: {
            from: { opacity: "0" },
            to: { opacity: "1" },
          },
          dialogContentShow: {
            from: {
              opacity: "0",
              transform: "translate(-50%, -45%) scale(0.95)",
            },
            to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          },
          drawerSlideLeftAndFade: {
            from: { opacity: "0", transform: "translateX(100%)" },
            to: { opacity: "1", transform: "translateX(0)" },
          },
          drawerSlideRightAndFade: {
            from: { opacity: "1", transform: "translateX(0)" },
            to: { opacity: "0", transform: "translateX(100%)" },
          },
        },
        animation: {
          hide: "hide 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          slideDownAndFade:
            "slideDownAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          slideLeftAndFade:
            "slideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          slideUpAndFade: "slideUpAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          slideRightAndFade:
            "slideRightAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          // Accordion
          accordionOpen: "accordionOpen 150ms cubic-bezier(0.87, 0, 0.13, 1)",
          accordionClose: "accordionClose 150ms cubic-bezier(0.87, 0, 0.13, 1)",
          // Dialog
          dialogOverlayShow:
            "dialogOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          dialogContentShow:
            "dialogContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          // Drawer
          drawerSlideLeftAndFade:
            "drawerSlideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          drawerSlideRightAndFade: "drawerSlideRightAndFade 150ms ease-in",
        },
      },
      colors: {
        vercel: {
          // Main background colors
          background: "#000000",
          foreground: "#FFFFFF",

          // Card and component colors
          card: {
            background: "#111111",
            foreground: "#FFFFFF",
            border: "#333333",
            hovered: "#191919",
          },

          // Accent colors
          primary: {
            DEFAULT: "#FFFFFF",
            foreground: "#000000",
          },
          secondary: {
            DEFAULT: "#666666",
            foreground: "#FFFFFF",
          },
          tertiary: {
            DEFAULT: "#bebebe",
            foreground: "#e2e2e2",
          },

          // Status colors
          success: {
            DEFAULT: "#30A46C",
            foreground: "#FFFFFF",
          },
          warning: {
            DEFAULT: "#FFB224",
            foreground: "#FFFFFF",
          },
          error: {
            DEFAULT: "#E5484D",
            foreground: "#FFFFFF",
          },

          // Muted elements
          muted: {
            DEFAULT: "#333333",
            foreground: "#999999",
          },

          // Border colors
          border: {
            DEFAULT: "#333333",
            hover: "#444444",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
