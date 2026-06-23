import LegalLayout from "./LegalLayout";

const PrivacyPolicy = () => (
  <LegalLayout
    title="Privacy Policy | Instruvex"
    description="Learn how Instruvex collects, uses, secures, and protects your personal information across our education and assessment platform."
    canonical="https://www.instruvex.in/privacy-policy"
    lastUpdated="June 23, 2026"
  >
    <p>
      This Privacy Policy explains how Instruvex ("we", "us", "our") collects, uses, discloses, and
      safeguards your information when you use our website, dashboard, ERP, examination engine, and
      Academy LMS (the "Services"). By using the Services, you consent to the practices described
      below.
    </p>

    <h2>1. Information We Collect</h2>
    <h3>Information you provide</h3>
    <ul>
      <li><strong>Account data:</strong> name, email address, phone number, profile photo, role, and institution.</li>
      <li><strong>Authentication data:</strong> passwords (stored as cryptographic hashes), OAuth identifiers from Google sign-in, and session tokens.</li>
      <li><strong>Academic data:</strong> course enrollments, exam attempts, assignment submissions, attendance records, certificate history.</li>
      <li><strong>Career data:</strong> resumes, cover letters, and application details submitted through our Careers module.</li>
      <li><strong>Communications:</strong> messages you send via contact forms, demo requests, or support channels.</li>
    </ul>
    <h3>Information collected automatically</h3>
    <ul>
      <li>Device, browser, IP address, and operating system information.</li>
      <li>Usage data such as pages visited, features used, and timestamps.</li>
      <li>Proctoring signals (tab switches, fullscreen events) during examinations, with prior notice.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To provide, operate, and improve the Services.</li>
      <li>To authenticate users, manage roles, and enforce institutional access controls.</li>
      <li>To deliver courses, evaluate assessments, issue certificates, and process applications.</li>
      <li>To send transactional emails, notifications, and important service updates.</li>
      <li>To detect fraud, prevent abuse, and uphold academic integrity.</li>
      <li>To comply with legal obligations.</li>
    </ul>

    <h2>3. Cookies & Similar Technologies</h2>
    <p>
      We use first-party cookies and local storage to keep you signed in, remember preferences, and
      secure your session. Some cookies are essential for the Services to function; others support
      analytics. You can manage cookies through your browser settings, but disabling essential
      cookies may impair your ability to use the platform.
    </p>

    <h2>4. Analytics</h2>
    <p>
      We use privacy-respecting analytics to understand aggregate usage patterns and improve our
      product. Analytics data is processed in an aggregated, pseudonymized form and is not used to
      identify you personally.
    </p>

    <h2>5. How We Share Information</h2>
    <p>We do not sell your personal information. We share data only with:</p>
    <ul>
      <li><strong>Your institution:</strong> administrators and instructors authorized to view your academic activity.</li>
      <li><strong>Service providers:</strong> hosting, database, authentication, payment, and email infrastructure providers acting under contractual data-protection obligations.</li>
      <li><strong>Legal authorities:</strong> when required by law, court order, or to protect rights, safety, or property.</li>
    </ul>

    <h2>6. Data Security</h2>
    <ul>
      <li>Encryption in transit using TLS for all client–server communications.</li>
      <li>Encrypted storage of credentials and sensitive data at rest.</li>
      <li>Row-Level Security on our database to enforce per-tenant and per-user isolation.</li>
      <li>Role-based access control (RBAC) for administrative functions.</li>
      <li>Regular security reviews, dependency scanning, and incident-response procedures.</li>
    </ul>
    <p>
      While we follow industry-standard practices, no method of transmission or storage is 100%
      secure. Please use a strong, unique password and notify us immediately of any suspected
      unauthorized access.
    </p>

    <h2>7. Data Retention</h2>
    <p>
      We retain personal data for as long as your account is active or as needed to provide the
      Services, comply with legal obligations, resolve disputes, and enforce agreements. You may
      request deletion of your account at any time, subject to records we must retain for compliance.
    </p>

    <h2>8. Your Rights</h2>
    <p>
      Depending on your jurisdiction, you may have rights to access, correct, export, restrict, or
      delete your personal information, and to object to certain processing. To exercise these rights,
      contact us using the details below.
    </p>

    <h2>9. Children's Privacy</h2>
    <p>
      Where Instruvex is used by minors through an educational institution, the institution is the
      data controller and is responsible for obtaining the necessary parental or guardian consents.
    </p>

    <h2>10. International Transfers</h2>
    <p>
      Your information may be processed in countries other than your own. We take steps to ensure
      transfers comply with applicable data-protection laws.
    </p>

    <h2>11. Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy from time to time. We will notify you of material changes by
      posting an updated version with a new "Last updated" date.
    </p>

    <h2>12. Contact Information</h2>
    <p>
      For privacy questions, data requests, or to report a concern, contact us at{" "}
      <a href="mailto:contact@instruvex.in">contact@instruvex.in</a>.
    </p>
  </LegalLayout>
);

export default PrivacyPolicy;