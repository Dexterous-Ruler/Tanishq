import { useLocation } from 'wouter';
import { ArrowLeft, BarChart3, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, FileText, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { useHealthInsights } from '@/hooks/useHealth';
import { useDocuments } from '@/hooks/useDocuments';
import { useQueries } from '@tanstack/react-query';
import { getDocumentInsights } from '@/lib/api/health';

export default function AIInsightsPage() {
  const [, setLocation] = useLocation();
  
  // Fetch overall health insights
  const { data: healthInsightsData, isLoading: healthInsightsLoading, refetch: refetchHealthInsights } = useHealthInsights();
  
  // Fetch all documents
  const { data: documentsData, isLoading: documentsLoading } = useDocuments({});
  
  // Get document IDs for fetching insights
  const documentIds = documentsData?.documents?.map(doc => doc.id) || [];
  
  // Fetch insights for all documents in parallel
  const documentInsightsQueries = useQueries({
    queries: documentIds.map((docId) => ({
      queryKey: ['document-insights', docId],
      queryFn: () => getDocumentInsights(docId),
      enabled: !!docId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    })),
  });

  const handleBack = () => {
    setLocation('/home');
  };

  const handleDocumentClick = (docId: string) => {
    setLocation(`/document/${docId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'normal':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good':
      case 'normal':
        return 'Normal';
      case 'warning':
        return 'Attention Needed';
      case 'critical':
        return 'Critical';
      default:
        return 'No Data';
    }
  };

  // Map documents with their insights
  const documentsWithInsights = documentsData?.documents?.map((doc, index) => {
    const insightQuery = documentInsightsQueries[index];
    const insight = insightQuery?.data?.success ? insightQuery.data.insight : null;
    
    return {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      date: doc.date ? new Date(doc.date).toISOString().split('T')[0] : 
            new Date(doc.createdAt).toISOString().split('T')[0],
      insight,
      isLoading: insightQuery?.isLoading || false,
    };
  }) || [];

  const overallStatus = healthInsightsData?.success ? healthInsightsData.insight.status : 'good';
  const overallMessage = healthInsightsData?.success ? healthInsightsData.insight.message : 
    'Upload lab reports and medical documents to get AI-powered health insights.';

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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AI Health Insights</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Overall Health Summary */}
        <div className="mb-8">
          <div className={`rounded-xl border-2 p-6 ${getStatusColor(overallStatus)}`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(overallStatus)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">Overall Health Summary</h2>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/50">
                    {getStatusLabel(overallStatus)}
                  </span>
                </div>
                {healthInsightsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-white/50 rounded animate-pulse"></div>
                    <div className="h-4 bg-white/50 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed">{overallMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Document Insights */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Document Insights
            </h2>
            <button
              onClick={() => refetchHealthInsights()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>

          {documentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : documentsWithInsights.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
              <p className="text-gray-600 mb-6">
                Upload medical documents to get AI-powered insights
              </p>
              <button
                onClick={() => setLocation('/vault')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Upload Documents
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {documentsWithInsights.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleDocumentClick(doc.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="capitalize">{doc.type}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(doc.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {doc.isLoading ? (
                        <div className="mt-4 space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                      ) : doc.insight ? (
                        <div className={`mt-4 p-4 rounded-lg border ${getStatusColor(doc.insight.status)}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(doc.insight.status)}
                            <span className="text-sm font-semibold">
                              {getStatusLabel(doc.insight.status)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{doc.insight.summary}</p>
                          {doc.insight.hasFullAnalysis && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDocumentClick(doc.id);
                              }}
                              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              View Full Analysis
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <p className="text-sm text-gray-600">
                            No insights available. Document may still be processing.
                          </p>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How AI Insights Work</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>AI analyzes your medical documents to identify patterns and trends</li>
                <li>Insights are generated using advanced medical AI models</li>
                <li>Status indicators help you prioritize which documents need attention</li>
                <li>All insights are for informational purposes only - consult your doctor for medical advice</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              <strong>Medical Disclaimer:</strong> AI insights are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

