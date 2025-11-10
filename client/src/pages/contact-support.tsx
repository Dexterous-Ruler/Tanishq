import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Mail, Phone, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SupportCategory = 'technical' | 'account' | 'billing' | 'general' | 'emergency';

export default function ContactSupportPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: 'general' as SupportCategory,
    subject: '',
    message: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    setLocation('/legal-support');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Success',
        description: 'Your support request has been submitted. We\'ll get back to you soon!',
      });
      setFormData({
        category: 'general',
        subject: '',
        message: '',
        email: '',
        phone: '',
      });
    }, 1500);
  };

  const supportCategories = [
    { value: 'technical', label: 'Technical Issue', description: 'App bugs, errors, or technical problems' },
    { value: 'account', label: 'Account Issue', description: 'Login, password, or account access problems' },
    { value: 'billing', label: 'Billing & Payment', description: 'Payment, subscription, or billing questions' },
    { value: 'general', label: 'General Inquiry', description: 'General questions or feedback' },
    { value: 'emergency', label: 'Urgent Issue', description: 'Critical problems requiring immediate attention' },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'support@arogyavault.com',
      description: 'Send us an email and we\'ll respond within 24 hours',
      color: 'blue',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      value: '+91 1800-XXX-XXXX',
      description: 'Call us for immediate assistance (Mon-Fri, 9 AM - 6 PM IST)',
      color: 'green',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      value: 'Available in-app',
      description: 'Chat with our support team in real-time',
      color: 'purple',
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
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Contact Methods */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const colorClasses = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                purple: 'bg-purple-50 text-purple-600',
              };

              return (
                <div
                  key={method.title}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <div className={`w-12 h-12 ${colorClasses[method.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                  <p className="text-sm font-medium text-gray-700 mb-2">{method.value}</p>
                  <p className="text-xs text-gray-600">{method.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supportCategories.map((category) => (
                  <label
                    key={category.value}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as SupportCategory })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{category.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please provide as much detail as possible..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Emergency Notice */}
            {formData.category === 'emergency' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Urgent Issue Selected</p>
                  <p className="text-xs text-red-800 mt-1">
                    For medical emergencies, please contact emergency services immediately. This form is for app-related urgent issues only.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Response Time Info */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Response Time:</strong> We typically respond within 24 hours. For urgent issues, please call our phone support.
          </p>
        </div>
      </div>
    </div>
  );
}

