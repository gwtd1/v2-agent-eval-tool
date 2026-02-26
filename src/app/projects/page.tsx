import Link from 'next/link';
import { ProjectExplorer } from '@/components/projects/ProjectExplorer';

export const metadata = {
  title: 'Project Explorer - Agent Eval Tool',
  description: 'Explore all available Treasure Data projects and their agents',
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Evaluation Tool</h1>
              <p className="mt-1 text-gray-600">Review and rate agent responses</p>
            </div>

            {/* Navigation Links */}
            <nav className="flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                🏠 Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Explorer</h1>
              <p className="mt-2 text-gray-600">
                Browse all Treasure Data projects accessible with your API key
              </p>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>⚡ Powered by Feature #1 API optimization</span>
            </div>
          </div>
        </div>

        {/* Project Explorer Component */}
        <ProjectExplorer />

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-3">💡 How to use this explorer</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Project Information</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• View all projects your API key can access</li>
                <li>• See agent counts and project descriptions</li>
                <li>• Click projects to expand and see all agents</li>
                <li>• Projects are sorted by agent count (most active first)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">Performance Features</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Fast loading via parallel API calls</li>
                <li>• Real-time performance metrics displayed</li>
                <li>• Green badge: &lt;300ms (3-5x faster than CLI)</li>
                <li>• Automatic error handling with helpful suggestions</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-blue-600 text-xs">
              <strong>Troubleshooting:</strong> If you don&apos;t see expected projects, verify your TD_API_KEY
              has the correct permissions in the Treasure Data console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}