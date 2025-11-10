import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'You can create an account by providing your phone number and verifying it with an OTP code. Once verified, you\'ll be guided through a simple onboarding process to set up your profile.',
  },
  {
    id: '2',
    category: 'Getting Started',
    question: 'What is ABHA ID and how do I link it?',
    answer: 'ABHA (Ayushman Bharat Health Account) is a unique health ID that helps you access and share your health records digitally. You can link your ABHA ID in the Profile settings section.',
  },
  {
    id: '3',
    category: 'Documents',
    question: 'How do I upload documents?',
    answer: 'Go to the Vault section and click the "+" button. You can upload prescriptions, lab reports, medical certificates, and other health documents. Supported formats include PDF, JPG, and PNG.',
  },
  {
    id: '4',
    category: 'Documents',
    question: 'How secure are my documents?',
    answer: 'Your documents are encrypted and stored securely. We use industry-standard security measures to protect your health data. Only you and people you explicitly grant access to can view your documents.',
  },
  {
    id: '5',
    category: 'Emergency Card',
    question: 'What is an Emergency Card?',
    answer: 'Your Emergency Card contains critical health information that can be accessed in emergencies via a QR code. This includes your blood group, allergies, chronic conditions, and emergency contacts.',
  },
  {
    id: '6',
    category: 'Emergency Card',
    question: 'How do I share my Emergency Card?',
    answer: 'You can share your Emergency Card by showing the QR code to medical professionals. They can scan it to access your critical health information. You can also print or share the QR code digitally.',
  },
  {
    id: '7',
    category: 'Consent & Sharing',
    question: 'How do I share my health records?',
    answer: 'Go to the Consent Center and create a new consent. You can specify who can access your records, what documents they can see, and for how long. You can revoke access at any time.',
  },
  {
    id: '8',
    category: 'Consent & Sharing',
    question: 'Can I see who has accessed my records?',
    answer: 'Yes, you can view the audit log in the Consent Center to see who has accessed your records and when. This helps you maintain control over your health data.',
  },
  {
    id: '9',
    category: 'Nominees',
    question: 'What is a nominee?',
    answer: 'A nominee is a trusted person you authorize to access your emergency information when you cannot. You can set different access levels and expiry dates for each nominee.',
  },
  {
    id: '10',
    category: 'Nominees',
    question: 'How do I add or remove a nominee?',
    answer: 'Go to Emergency Card and click "Manage Nominee". From there, you can add new nominees, edit their access, or revoke their access at any time.',
  },
  {
    id: '11',
    category: 'Account & Security',
    question: 'How do I change my password?',
    answer: 'Currently, password changes are handled through phone number verification. If you need to reset your password, please contact support.',
  },
  {
    id: '12',
    category: 'Account & Security',
    question: 'How do I enable biometric authentication?',
    answer: 'Go to Profile Settings and toggle the biometric authentication option. Make sure your device supports fingerprint or face recognition.',
  },
  {
    id: '13',
    category: 'Troubleshooting',
    question: 'I can\'t upload a document. What should I do?',
    answer: 'Make sure the file is in a supported format (PDF, JPG, PNG) and is under 10MB. Check your internet connection and try again. If the problem persists, contact support.',
  },
  {
    id: '14',
    category: 'Troubleshooting',
    question: 'My documents are not syncing. What\'s wrong?',
    answer: 'Check your internet connection first. Documents sync automatically when you\'re online. If sync issues persist, try refreshing the page or contact support.',
  },
];

export default function FAQPage() {
  const [, setLocation] = useLocation();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleBack = () => {
    setLocation('/legal-support');
  };

  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenItems(newOpen);
  };

  const categories = ['all', ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">FAQ / Help Center</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No results found. Try a different search term.</p>
            </div>
          ) : (
            filteredFAQs.map((item) => {
              const isOpen = openItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="text-xs text-blue-600 font-medium mb-1">
                        {item.category}
                      </div>
                      <h3 className="font-semibold text-gray-900">{item.question}</h3>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 ml-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Still need help?</h3>
          <p className="text-sm text-blue-800 mb-4">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <button
            onClick={() => setLocation('/legal/contact')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

