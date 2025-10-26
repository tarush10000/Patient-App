import "./globals.css";

export const metadata = {
  // Primary Meta Tags
  title: "Dr. Anjali Gupta - Women Wellness Center | Book Appointment Online",
  description: "Schedule your appointment with Dr. Anjali Gupta at Women Wellness Center. Expert gynecological care, women's health services, and comprehensive wellness treatments in Agra. Easy online booking available.",
  keywords: "Dr. Anjali Gupta, women wellness, gynecologist appointment, women's health, book appointment, gynecology clinic, women healthcare, Agra gynecologist, online appointment booking",
  authors: [{ name: "Dr. Anjali Women Wellness Center" }],
  
  // Verification and Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  
  // Open Graph / Facebook
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://appointment.dranjaligupta.in",
    siteName: "Dr. Anjali Women Wellness Center",
    title: "Dr. Anjali Gupta - Women Wellness Center | Book Appointment Online",
    description: "Schedule your appointment with Dr. Anjali Gupta. Expert women's health care and wellness services. Easy online booking available.",
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Dr. Anjali Gupta - Women Wellness Center | Book Appointment",
    description: "Schedule your appointment with Dr. Anjali Gupta. Expert women's health care and wellness services.",
  },
  
  // Additional Meta
  alternates: {
    canonical: "https://appointment.dranjaligupta.in",
  },
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Manifest
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data / Schema.org for Local Medical Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Dr. Anjali Women Wellness Center",
              "image": "https://appointment.dranjaligupta.in/images/clinic-logo.jpg",
              "url": "https://appointment.dranjaligupta.in",
              "telephone": "+91-7300843777", // Add your phone number
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  "opens": "09:00",
                  "closes": "18:00"
                }
              ],
              "priceRange": "₹₹",
              "medicalSpecialty": "Gynecology"
            })
          }}
        />
        
        {/* Physician Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Physician",
              "name": "Dr. Anjali Gupta",
              "medicalSpecialty": ["Gynecology", "Women's Health"],
              "memberOf": {
                "@type": "MedicalOrganization",
                "name": "Dr. Anjali Women Wellness Center"
              },
              "url": "https://appointment.dranjaligupta.in"
            })
          }}
        />
        
        {/* WebSite Schema for Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Dr. Anjali Women Wellness Center",
              "url": "https://appointment.dranjaligupta.in",
              "potentialAction": {
                "@type": "ReserveAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://appointment.dranjaligupta.in/login"
                },
                "result": {
                  "@type": "Reservation",
                  "name": "Book Medical Appointment"
                }
              }
            })
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}