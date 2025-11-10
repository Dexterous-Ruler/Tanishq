import { useLocation } from 'wouter';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsConditionsPage() {
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
            <FileText className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Terms & Conditions</h1>
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
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Arogya Vault ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p>
                Arogya Vault is a digital health records management platform that allows users to store, manage, and share their medical documents and health information securely. The Service includes features such as document storage, emergency card management, consent-based sharing, and nominee access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts and Responsibilities</h2>
              <p className="mb-3">You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring the accuracy of the information you provide</li>
                <li>Complying with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Health Information and Data</h2>
              <p className="mb-3">You acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are solely responsible for the accuracy and completeness of health information you upload</li>
                <li>The Service is not a substitute for professional medical advice, diagnosis, or treatment</li>
                <li>We do not verify the medical accuracy of information stored in the Service</li>
                <li>You should consult healthcare professionals for medical decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Privacy and Data Security</h2>
              <p>
                We take your privacy seriously. Your health data is encrypted and stored securely. We implement industry-standard security measures to protect your information. For detailed information about how we collect, use, and protect your data, please review our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Consent and Sharing</h2>
              <p className="mb-3">When you share your health information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You control who has access to your information</li>
                <li>You can revoke access at any time</li>
                <li>Recipients are bound by confidentiality obligations</li>
                <li>You are responsible for ensuring recipients use the information appropriately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Prohibited Uses</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Upload false, misleading, or fraudulent information</li>
                <li>Attempt to gain unauthorized access to other users' accounts or data</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by Arogya Vault and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                Arogya Vault shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service. We do not guarantee that the Service will be available at all times or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Medical Disclaimer</h2>
              <p>
                The Service is provided for informational and organizational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact Information</h2>
              <p>
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> legal@arogyavault.com<br />
                <strong>Address:</strong> [Company Address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

