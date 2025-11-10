import { useLocation } from 'wouter';
import { ArrowLeft, HelpCircle, Mail, FileText, Shield, ChevronRight } from 'lucide-react';

export default function LegalSupportPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/profile');
  };

  const menuItems = [
    {
      id: 'faq',
      title: 'FAQ / Help Center',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      path: '/legal/faq',
      color: 'blue',
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: Mail,
      path: '/legal/contact',
      color: 'green',
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      description: 'Read our terms of service',
      icon: FileText,
      path: '/legal/terms',
      color: 'purple',
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      description: 'Learn how we protect your data',
      icon: Shield,
      path: '/legal/privacy',
      color: 'orange',
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Legal & Support</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-gray-600 text-lg">
            Find help, get support, and review our legal documents
          </p>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              purple: 'bg-purple-50 text-purple-600',
              orange: 'bg-orange-50 text-orange-600',
            };

            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className="w-full bg-white rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition-all border border-gray-200 hover:border-gray-300"
              >
                <div className={`p-3 rounded-lg ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Need Immediate Help?</h3>
          <p className="text-sm text-blue-800 mb-4">
            If you're experiencing an emergency or urgent issue, please contact our support team directly.
          </p>
          <button
            onClick={() => setLocation('/legal/contact')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Contact Support Now
          </button>
        </div>
      </div>
    </div>
  );
}

