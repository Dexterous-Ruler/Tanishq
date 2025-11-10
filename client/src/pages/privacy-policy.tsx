import { useLocation } from 'wouter';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/legal-support');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-gray-700">
              At Arogya Vault, we are committed to protecting your privacy and ensuring the security of your health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.1 Personal Information</h3>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Phone number and email address</li>
                <li>Name, date of birth, and gender</li>
                <li>ABHA ID (if linked)</li>
                <li>Address and contact information</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.2 Health Information</h3>
              <p className="mb-3">You may choose to upload and store:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Medical documents (prescriptions, lab reports, certificates)</li>
                <li>Emergency health information (blood group, allergies, medications)</li>
                <li>Health records and medical history</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.3 Usage Information</h3>
              <p className="mb-3">We automatically collect certain information when you use our Service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information and IP address</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log data and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process your requests and transactions</li>
                <li>Send you important updates and notifications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Security</h2>
              <p className="mb-3">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using AES-256 encryption</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms</li>
                <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
                <li><strong>Secure Infrastructure:</strong> Data stored on secure, compliant cloud infrastructure</li>
                <li><strong>Backup & Recovery:</strong> Regular backups and disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing and Disclosure</h2>
              <p className="mb-3">We do not sell your personal or health information. We may share your information only in the following circumstances:</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.1 With Your Consent</h3>
              <p>We share your information with healthcare providers, family members, or other parties only when you explicitly grant consent through our consent management system.</p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.2 Service Providers</h3>
              <p>We may share information with trusted third-party service providers who assist us in operating our Service, subject to strict confidentiality agreements.</p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.3 Legal Requirements</h3>
              <p>We may disclose information if required by law, court order, or government regulation, or to protect our rights and the safety of our users.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights and Choices</h2>
              <p className="mb-3">You have the following rights regarding your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request access to your personal and health information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Export:</strong> Export your data in a portable format</li>
                <li><strong>Consent Management:</strong> Control who has access to your information</li>
                <li><strong>Opt-out:</strong> Opt out of non-essential communications</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at privacy@arogyavault.com or through the app settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete or anonymize your information within 30 days, except where we are required to retain it for legal or regulatory purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist with security. You can control cookies through your browser settings, though this may affect some functionality of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Compliance with Regulations</h2>
              <p className="mb-3">We comply with applicable data protection regulations, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Digital Personal Data Protection Act (DPDPA), India</li>
                <li>Health Insurance Portability and Accountability Act (HIPAA) standards where applicable</li>
                <li>General Data Protection Regulation (GDPR) principles</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="mt-3">
                <strong>Privacy Officer</strong><br />
                Email: privacy@arogyavault.com<br />
                Address: [Company Address]<br />
                Phone: +91 1800-XXX-XXXX
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

